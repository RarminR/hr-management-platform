import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { addMonths } from 'date-fns';

// POST /api/admin/maintenance - Run maintenance jobs
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      expiredWarnings: 0,
      expiredAuthorizations: 0,
      overdueHealthVisits: 0,
      notifications: [],
    };

    // 1. Expire old warnings (older than 12 months)
    const expiredWarningsResult = await db
      .updateTable('warnings')
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where('is_active', '=', true)
      .where('expiry_date', '<=', new Date())
      .execute();

    results.expiredWarnings = Number(expiredWarningsResult[0]?.numUpdatedRows || 0);

    // 2. Flag expired authorizations
    const expiredAuthResult = await db
      .updateTable('authorizations')
      .set({
        is_suspended: true,
        suspension_reason: 'Expired - automatic system check',
        updated_at: new Date(),
      })
      .where('expiry_date', '<', new Date())
      .where('is_suspended', '=', false)
      .execute();

    results.expiredAuthorizations = Number(expiredAuthResult[0]?.numUpdatedRows || 0);

    // 3. Find overdue health visits and create notifications
    const overdueVisits = await db
      .selectFrom('occupational_health_visits as v')
      .innerJoin('employees as e', 'e.id', 'v.employee_id')
      .select([
        'v.id',
        'v.employee_id',
        'v.next_visit_date',
        'e.name',
        'e.surname',
        'e.email',
      ])
      .where('v.next_visit_date', '<', new Date())
      .where('e.employment_status', '=', 'active')
      .limit(50)
      .execute();

    results.overdueHealthVisits = overdueVisits.length;

    // 4. Check for licenses expiring in next 30 days
    const expiringLicenses = await db
      .selectFrom('driving_licenses as dl')
      .innerJoin('employees as e', 'e.id', 'dl.employee_id')
      .select([
        'dl.id',
        'dl.license_number',
        'dl.expiry_date',
        'e.name',
        'e.surname',
        'e.email',
      ])
      .where('dl.expiry_date', '<=', addMonths(new Date(), 1))
      .where('dl.expiry_date', '>', new Date())
      .where('e.employment_status', '=', 'active')
      .execute();

    // 5. Check for authorizations expiring in next 30 days
    const expiringAuths = await db
      .selectFrom('authorizations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select([
        'a.id',
        'a.authorization_type',
        'a.expiry_date',
        'e.name',
        'e.surname',
        'e.email',
      ])
      .where('a.expiry_date', '<=', addMonths(new Date(), 1))
      .where('a.expiry_date', '>', new Date())
      .where('a.is_suspended', '=', false)
      .where('e.employment_status', '=', 'active')
      .execute();

    // 6. Check for employees with 3+ warnings (Yellow Card)
    const yellowCardCandidates = await db
      .selectFrom('warnings as w')
      .innerJoin('employees as e', 'e.id', 'w.employee_id')
      .select([
        'e.id',
        'e.name',
        'e.surname',
      ])
      .select(sql<number>`COUNT(w.id)`.as('warning_count'))
      .where('w.is_active', '=', true)
      .where('w.expiry_date', '>', new Date())
      .where('e.employment_status', '=', 'active')
      .groupBy(['e.id', 'e.name', 'e.surname'])
      .having(sql`COUNT(w.id)`, '>=', 3)
      .execute();

    // 7. Check for employees with 3+ appreciations (Salary increase recommendation)
    const salaryIncreaseCandidates = await db
      .selectFrom('appreciations as a')
      .innerJoin('employees as e', 'e.id', 'a.employee_id')
      .select([
        'e.id',
        'e.name',
        'e.surname',
      ])
      .select(sql<number>`COUNT(a.id)`.as('appreciation_count'))
      .where('a.appreciation_date', '>=', addMonths(new Date(), -12))
      .where('e.employment_status', '=', 'active')
      .groupBy(['e.id', 'e.name', 'e.surname'])
      .having(sql`COUNT(a.id)`, '>=', 3)
      .execute();

    // Log maintenance run
    await db
      .insertInto('audit_logs')
      .values({
        user_id: session.user.id,
        action: 'create' as const,
        entity_type: 'maintenance_job',
        entity_id: null,
        new_values: JSON.stringify({
          timestamp: new Date(),
          results,
          expiringLicenses: expiringLicenses.length,
          expiringAuthorizations: expiringAuths.length,
          yellowCardCandidates: yellowCardCandidates.length,
          salaryIncreaseCandidates: salaryIncreaseCandidates.length,
        }),
      })
      .execute();

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      results: {
        ...results,
        expiringLicenses: expiringLicenses.length,
        expiringAuthorizations: expiringAuths.length,
        yellowCardCandidates: yellowCardCandidates.length,
        salaryIncreaseCandidates: salaryIncreaseCandidates.length,
      },
      notifications: {
        expiring: {
          licenses: expiringLicenses.map(l => ({
            employee: `${l.name} ${l.surname}`,
            item: `License #${l.license_number}`,
            expiryDate: l.expiry_date,
          })),
          authorizations: expiringAuths.map(a => ({
            employee: `${a.name} ${a.surname}`,
            item: a.authorization_type,
            expiryDate: a.expiry_date,
          })),
        },
        warnings: yellowCardCandidates.map((e: any) => ({
          employee: `${e.name} ${e.surname}`,
          warningCount: e.warning_count,
          action: 'Yellow Card candidate',
        })),
        appreciations: salaryIncreaseCandidates.map((e: any) => ({
          employee: `${e.name} ${e.surname}`,
          appreciationCount: e.appreciation_count,
          action: 'Salary increase recommended (+3%)',
        })),
      },
    });
  } catch (error) {
    console.error('Error running maintenance jobs:', error);
    return NextResponse.json(
      { error: 'Failed to run maintenance jobs' },
      { status: 500 }
    );
  }
}

// GET /api/admin/maintenance - Get last maintenance run info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lastRun = await db
      .selectFrom('audit_logs')
      .selectAll()
      .where('entity_type', '=', 'maintenance_job')
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    return NextResponse.json({
      lastRun: lastRun ? {
        timestamp: lastRun.created_at,
        results: JSON.parse(lastRun.new_values as string || '{}'),
      } : null,
    });
  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance info' },
      { status: 500 }
    );
  }
}