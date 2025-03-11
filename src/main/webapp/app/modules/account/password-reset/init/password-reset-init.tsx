import React, { useEffect, useState } from 'react';
import { Translate, translate, ValidatedField, ValidatedForm, isEmail } from 'react-jhipster';
import { Button, Alert, Col, Row } from 'reactstrap';
import { toast } from 'react-toastify';

import { handlePasswordResetInit, reset } from '../password-reset.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getTenant } from 'app/shared/tenant/TenantContext';

export const PasswordResetInit = () => {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(state => state.tenant.tenant);
  const successMessage = useAppSelector(state => state.passwordReset.successMessage);

  // Loading state to track when data is ready
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(false);
    };

    fetchData();

    return () => {
    };
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(translate(successMessage));
    }
  }, [successMessage]);

  const handleValidSubmit = ({ email }) => {
    dispatch(handlePasswordResetInit({ email, tenant }));
  };

  // Show a div (or a loader) until everything is loaded
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h1>
            <Translate contentKey="reset.request.title">Reset your password</Translate>
          </h1>
          <Alert color="warning">
            <p>
              <Translate contentKey="reset.request.messages.info">Enter the email address you used to register</Translate>
            </p>
          </Alert>
          <ValidatedForm onSubmit={handleValidSubmit}>
            <ValidatedField
              name="email"
              label={translate('global.form.email.label')}
              placeholder={translate('global.form.email.placeholder')}
              type="email"
              validate={{
                required: { value: true, message: translate('global.messages.validate.email.required') },
                minLength: { value: 5, message: translate('global.messages.validate.email.minlength') },
                maxLength: { value: 254, message: translate('global.messages.validate.email.maxlength') },
                validate: v => isEmail(v) || translate('global.messages.validate.email.invalid'),
              }}
              data-cy="emailResetPassword"
            />
            <Button color="primary" type="submit" data-cy="submit">
              <Translate contentKey="reset.request.form.button">Reset password</Translate>
            </Button>
          </ValidatedForm>
        </Col>
      </Row>
    </div>
  );
};

export default PasswordResetInit;
