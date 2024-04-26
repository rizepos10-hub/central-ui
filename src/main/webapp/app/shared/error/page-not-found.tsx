import React from 'react';
import { Translate } from 'react-jhipster';
import { Alert } from 'reactstrap';

const PageNotFound = () => {
  return (
    <div>
      <Alert color="danger">
        <Translate contentKey="error.http.404">Coming Soon!</Translate>
      </Alert>
    </div>
  );
};

export default PageNotFound;
