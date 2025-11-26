'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const [apiSession, setApiSession] = useState<any>(null);

  useEffect(() => {
    // Also fetch from API to compare
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setApiSession(data))
      .catch(err => console.error('API fetch error:', err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Client-side Session (useSession hook)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Status: <strong>{status}</strong></p>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Session (/api/auth/session)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(apiSession, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set in NEXT_PUBLIC'}</p>
            <p>NODE_ENV: {process.env.NODE_ENV}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}