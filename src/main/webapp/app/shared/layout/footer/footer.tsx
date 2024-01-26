import './footer.scss';

import React from 'react';
import { Translate } from 'react-jhipster';
import { Col, Row } from 'reactstrap';

const commitId = DEVELOPMENT ? `Commit ID: ${process.env.REACT_APP_COMMIT_ID}` : null;
const Footer = () => (
  <div className="footer ">
    <Row>
      <Col md="12">
        <Translate contentKey="footer" interpolate={commitId}>
          RIZE POS
        </Translate>
       {commitId}
      </Col>
    </Row>
  </div>
);

export default Footer;
