import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { db } from "@/lib/db/client";
import { sql } from "kysely";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee count
    const employeeCount = await db
      .selectFrom("employees")
      .select(db.fn.count("id").as("count"))
      .executeTakeFirst();

    // Get active employees count
    const activeEmployees = await db
      .selectFrom("employees")
      .select(db.fn.count("id").as("count"))
      .where("employment_status", "=", "active")
      .executeTakeFirst();

    // Get departments count
    const departmentCount = await db
      .selectFrom("departments")
      .select(db.fn.count("id").as("count"))
      .executeTakeFirst();

    // Get expiring authorizations (within 30 days)
    const expiringAuthorizations = await db
      .selectFrom("authorizations")
      .select(db.fn.count("id").as("count"))
      .where(sql`expiry_date`, "<=", sql`CURRENT_DATE + INTERVAL '30 days'`)
      .where(sql`expiry_date`, ">=", sql`CURRENT_DATE`)
      .executeTakeFirst();

    // Get expiring medical visits (within 30 days)
    const expiringMedical = await db
      .selectFrom("occupational_health_visits")
      .select(db.fn.count("id").as("count"))
      .where(sql`next_visit_date`, "<=", sql`CURRENT_DATE + INTERVAL '30 days'`)
      .where(sql`next_visit_date`, ">=", sql`CURRENT_DATE`)
      .executeTakeFirst();

    // Get recent warnings (last 7 days)
    const recentWarnings = await db
      .selectFrom("warnings")
      .select(db.fn.count("id").as("count"))
      .where(sql`warning_date`, ">=", sql`CURRENT_DATE - INTERVAL '7 days'`)
      .executeTakeFirst();

    // Get recent employees (hired in last 30 days)
    const recentHires = await db
      .selectFrom("employees")
      .select(db.fn.count("id").as("count"))
      .where(sql`hire_date`, ">=", sql`CURRENT_DATE - INTERVAL '30 days'`)
      .executeTakeFirst();

    // Get employees by department
    const employeesByDept = await db
      .selectFrom("departments as d")
      .leftJoin("employees as e", "e.department_id", "d.id")
      .select([
        "d.name",
        sql<string>`count(e.id)`.as("employeeCount")
      ])
      .where("e.employment_status", "=", "active")
      .groupBy("d.id")
      .groupBy("d.name")
      .orderBy(sql`count(e.id)`, "desc")
      .limit(5)
      .execute();

    // Get upcoming birthdays (next 30 days)
    const upcomingBirthdays = await db
      .selectFrom("employees")
      .select([
        "id",
        "name",
        "surname",
        "date_of_birth"
      ])
      .where("employment_status", "=", "active")
      .where(sql`
        (
          EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) 
          AND EXTRACT(DAY FROM date_of_birth) >= EXTRACT(DAY FROM CURRENT_DATE)
        )
        OR (
          EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 month')
          AND EXTRACT(DAY FROM date_of_birth) <= EXTRACT(DAY FROM CURRENT_DATE)
        )
      `, "=", sql`true`)
      .orderBy(sql`EXTRACT(MONTH FROM date_of_birth)`, "asc")
      .orderBy(sql`EXTRACT(DAY FROM date_of_birth)`, "asc")
      .limit(5)
      .execute();

    // Get recent appreciations (last 30 days)
    const recentAppreciations = await db
      .selectFrom("appreciations")
      .innerJoin("employees", "employees.id", "appreciations.employee_id")
      .select([
        "employees.name",
        "employees.surname",
        "appreciations.reason",
        "appreciations.appreciation_date"
      ])
      .where(sql`appreciations.appreciation_date`, ">=", sql`CURRENT_DATE - INTERVAL '30 days'`)
      .orderBy("appreciations.appreciation_date", "desc")
      .limit(5)
      .execute();

    const stats = {
      employees: {
        total: Number(employeeCount?.count || 0),
        active: Number(activeEmployees?.count || 0),
        recentHires: Number(recentHires?.count || 0)
      },
      departments: {
        total: Number(departmentCount?.count || 0),
        byDepartment: employeesByDept.map(d => ({
          name: d.name,
          count: Number(d.employeeCount || 0)
        }))
      },
      alerts: {
        expiringAuthorizations: Number(expiringAuthorizations?.count || 0),
        expiringMedical: Number(expiringMedical?.count || 0),
        recentWarnings: Number(recentWarnings?.count || 0),
        totalExpiring: Number(expiringAuthorizations?.count || 0) + Number(expiringMedical?.count || 0)
      },
      upcoming: {
        birthdays: upcomingBirthdays.map(emp => ({
          id: emp.id,
          name: `${emp.name} ${emp.surname}`,
          dateOfBirth: emp.date_of_birth
        }))
      },
      recentActivity: {
        appreciations: recentAppreciations.map(app => ({
          employee: `${app.name} ${app.surname}`,
          reason: app.reason,
          date: app.appreciation_date
        }))
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}