import React, { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { logisticsRoutes } from './logistics.mock';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RoutesPage = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
          <CardDescription>Every route links back to its warehouse orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {logisticsRoutes.map(route => (
              <Card
                key={route.id}
                className="border-slate-200 bg-white shadow-sm hover:shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <Badge className="bg-slate-100 text-slate-800">{route.distance}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Driver</p>
                      <p className="font-medium">{route.driver}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Truck</p>
                      <p className="font-medium">{route.truck}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <p className="font-medium">{route.status}</p>
                    </div>
                    <div className="text-sm text-slate-500">
                      ETA <span className="font-medium text-slate-900">{route.estimatedTime}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        startTransition(() => navigate(`/logistics/routes/${route.id}`))
                      }
                    >
                      Route Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default RoutesPage;
