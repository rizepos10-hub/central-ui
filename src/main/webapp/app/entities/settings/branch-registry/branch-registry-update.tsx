import React, { useEffect, useState } from "react";
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, reset } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { Link, useParams } from "react-router-dom";
import TillsTable, { PreviousTill } from "app/entities/settings/branch-registry/till/previous-till";
import { Translate } from "react-jhipster";
import { closeEntity as closeTill } from "app/entities/settings/branch-registry/till/till.reducer";

import CurrentTill from "app/entities/settings/branch-registry/till/current-till";
import ActivateTillModal from "app/entities/settings/branch-registry/till/activate-till-modal";
import BranchRegistryTerminalSettings from "./branch-registry-terminal-settings";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, ArrowLeft } from 'lucide-react';

const BranchRegistryUpdate = ({ isRegisterClosure }: { isRegisterClosure?: boolean }) => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
  const loading = useAppSelector(state => state.branchRegistry.loading);
  const updateTillSuccess = useAppSelector(state => state.till.updateSuccess);

  const closeTillRequested = branchRegistry.openTill?.status === "CLOSE_REQUESTED";


  const handleCloseTill = () => dispatch(closeTill(branchRegistry?.openTill?.id));

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, [updateTillSuccess]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{branchRegistry.name}</h1>
            {branchRegistry.openTill && (
              <Button
                disabled={closeTillRequested}
                onClick={handleCloseTill}
                variant={closeTillRequested ? "secondary" : "default"}
              >
                {closeTillRequested ? "Close Requested" : "Request Close"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <strong>Name:</strong> {branchRegistry.name}
          </p>
          <p>
            <strong>Code:</strong> {branchRegistry.code}
          </p>
          <p>
            <strong>Branch:</strong> {branchRegistry.branch?.name}
          </p>
          <p>
            <strong>Last Online:</strong> {new Date(branchRegistry.lastOnline).toLocaleString()}
          </p>
          {branchRegistry?.openTill && (
            <div>
              <strong>Current Till</strong>
              <CurrentTill till={branchRegistry?.openTill} />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="previous-tills" className="w-full">
        <TabsList>
          <TabsTrigger value="previous-tills">Previous Tills</TabsTrigger>
          <TabsTrigger value="terminal-settings">Terminal Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="previous-tills">
          <PreviousTill isRegisterClosure={isRegisterClosure} registryId={id} />
        </TabsContent>
        <TabsContent value="terminal-settings">
          <BranchRegistryTerminalSettings />
        </TabsContent>
      </Tabs>

      {/* {showModal && <ActivateTillModal registryId={id} toggle={toggleModal} isOpen={showModal} />} */}

      <div className="mt-3">
        <Button
          asChild
          variant="outline"
        >
          <Link to={isRegisterClosure ? "/analytics/register-closure" : "/branch-register"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <Translate contentKey="entity.action.back">Back</Translate>
          </Link>
        </Button>
      </div>
    </div>
  );
};
export default BranchRegistryUpdate;
