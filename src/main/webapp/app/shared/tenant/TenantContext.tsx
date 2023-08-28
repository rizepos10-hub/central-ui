import React from 'react';

let TenantContext: React.Context<string>;
// @ts-ignore
TenantContext = React.createContext();

export default TenantContext;
