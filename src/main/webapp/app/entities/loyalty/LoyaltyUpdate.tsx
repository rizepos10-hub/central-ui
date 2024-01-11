import React from 'react';
import {InputNumber} from "primereact/inputnumber";
import {Button} from "reactstrap";
import {Link, useNavigate, useParams} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Translate} from "react-jhipster";
export const LoyaltyUpdate = () => {
  // get the id
  const { id } = useParams<'id'>();  // fetch the loyal customer
  // edit the loyal customer
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-column gap-5">
        <h2>Edit Loyalty Points</h2>
        <p>Name of the customer: {id}</p>
        <div className="">
          <label htmlFor="points" className="font-bold block mb-2">Points</label>
          <InputNumber inputId='points' placeholder="Points" minFractionDigits={2} maxFractionDigits={5} showButtons/>
        </div>

        <div>
          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/loyalty" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>
          &nbsp;
          <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit">
            <FontAwesomeIcon icon="save" />
            &nbsp;
            <Translate contentKey="entity.action.save">Save</Translate>
          </Button>
        </div>

      </div>
    </>
  );
}
