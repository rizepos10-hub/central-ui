import {Col, Row} from "reactstrap";
import {Translate} from "react-jhipster";
import {Checkbox} from "primereact/checkbox";
import React from "react";

const ItemLoyaltyTab = ({excludedFromLoyaltyPoints, onFieldChange}) => {

  return (
    <Row className={"my-3" } >
      <Col md={"4"}>
        <div className={"d-flex my-3 gap-2"}>
          <label className={"text-xl font-bold"}>
            <Translate contentKey="items.update.excludedFromLoyalty">Excluded From Loyalty Points</Translate>
          </label>
          <Checkbox
            checked={excludedFromLoyaltyPoints}
            onChange={(e) => onFieldChange('excludedFromLoyaltyPoints', e.checked)}
          />
        </div>
      </Col>
    </Row>
  );
};

export default ItemLoyaltyTab;
