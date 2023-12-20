import './footer.scss';

import React from 'react';
import { Translate } from 'react-jhipster';
import { Col, Row } from 'reactstrap';

const commitId = process.env.REACT_APP_COMMIT_ID;
console.log(`Current commit ID: ${commitId}`);
const Footer = () => (
  <div className="footer ">
    <Row>
      <Col md="12">
        <Translate contentKey="footer" interpolate={ commitId }>
          RIZE POS
        </Translate>
          Commit ID: {commitId}
      </Col>
    </Row>
  </div>
);

export default Footer;
