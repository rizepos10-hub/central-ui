import React, { useEffect, useState } from 'react';
import { fetchTopCustomers, fetchTopItems } from 'app/modules/analytics/api';
import { Translate } from 'react-jhipster';
import ImageDisplay from 'app/shared/components/image/image-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TopItems = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [bestCustomers, setBestCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const topItemsData = await fetchTopItems();
      setBestSellers(topItemsData);

      const topCustomersData = await fetchTopCustomers();
      setBestCustomers(topCustomersData);
    };
    fetchData();
  }, []);

  const filteredBestSellers = bestSellers.filter(item => item.itemId !== null);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Sellers Card */}
        <Card className="h-full">
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-semibold">
              <Translate contentKey={'analytics.topItems.title'}>Best Sellers</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {filteredBestSellers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No top items available
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-7 text-xs">
                        <Translate contentKey={'analytics.topItems.name'}>Name</Translate>
                      </TableHead>
                      <TableHead className="h-7 text-xs">
                        <Translate contentKey={'analytics.topItems.variant'}>Variant</Translate>
                      </TableHead>
                      <TableHead className="h-7 text-xs text-right">
                        <Translate contentKey={'analytics.topItems.count'}>Order Count</Translate>
                      </TableHead>
                      <TableHead className="h-7 text-xs text-center">
                        <Translate contentKey={'analytics.topItems.image'}>Image</Translate>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBestSellers.map((item, index) => (
                      <TableRow key={`entity-${index}`} data-cy="entityTable" className="h-7 text-xs">
                        <TableCell className="py-1">{item.itemName}</TableCell>
                        <TableCell className="py-1">{item.variantName}</TableCell>
                        <TableCell className="py-1 text-right">{item.orderCount}</TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="flex justify-center">
                            <ImageDisplay
                              imageType={'product'}
                              imageUrl={item?.attachments?.[0]?.url || item?.variants?.[0]?.attachments?.[0]?.url}
                              height={50}
                              width={50}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Customers Card */}
        <Card className="h-full">
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-semibold">
              <Translate contentKey={'analytics.bestCustomers.title'}>Best Customers</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {bestCustomers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No top customers available
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-7 text-xs">
                        <Translate contentKey={'analytics.bestCustomers.name'}>Customer Name</Translate>
                      </TableHead>
                      <TableHead className="h-7 text-xs text-right">
                        <Translate contentKey={'analytics.bestCustomers.orders'}>Orders</Translate>
                      </TableHead>
                      <TableHead className="h-7 text-xs">
                        <Translate contentKey={'analytics.bestCustomers.phone'}>Phone Number</Translate>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestCustomers.map((customer, index) => {
                      const customerName = `${customer?.firstName ?? ''} ${customer.lastName ?? ''}`;
                      return (
                        <TableRow key={`entity-${index}`} data-cy="entityTable" className="h-7 text-xs">
                          <TableCell className="py-1">
                            {customerName.trim() !== '' ? customerName : customer?.id}
                          </TableCell>
                          <TableCell className="py-1 text-right">{customer.count}</TableCell>
                          <TableCell className="py-1">{customer.phone}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopItems;
