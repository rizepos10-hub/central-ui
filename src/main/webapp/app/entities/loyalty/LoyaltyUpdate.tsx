import React, {useEffect, useRef, useState} from 'react';
import {InputNumber} from "primereact/inputnumber";
import {Button} from "reactstrap";
import {Link, useNavigate, useParams} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Translate} from "react-jhipster";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getLoyaltyRecordById, updateLoyaltyRecord} from "app/entities/loyalty/loyalty-records.reducer";

export const LoyaltyUpdate = () => {
  const { id } = useParams<'id'>();  // fetch the loyal customer

  const dispatch = useAppDispatch();
  const record = useAppSelector(state => state.loyalty.entity);
  const loading = useAppSelector(state => state.loyalty.loading);
  const updating = useAppSelector(state => state.loyalty.updating);
  const updateSuccess = useAppSelector(state => state.loyalty.updateSuccess);

  const navigate = useNavigate();
  const pointsRef = useRef<HTMLInputElement>(null);
  const onSave = (e) => {
    e.preventDefault();
    dispatch(updateLoyaltyRecord({id:record.id, points}));
  }

  const [points, setPoints] = useState<number>(0);
  const handlePointsChange = (e) => {
    setPoints(+(e.value));
  }
  useEffect(()=>{
    if (id !== 'CUSTOMER_NOT_FOUND') {
      dispatch(getLoyaltyRecordById(id));
    }
  }, [])
  useEffect(()=>{
    setPoints(record.points);
  }, [record])

  useEffect(()=>{
    if (updateSuccess){
      console.log("UPDATE SUCCESS..");
      navigate('/loyalty');
    }else{
      console.log("UPDATE Failed..");
    }
  }, [updateSuccess])

  if (loading) return <p>Loading...</p>;
  if (id === 'CUSTOMER_NOT_FOUND') return (
    <>
      <h2>Customer Not Found</h2>
      <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/loyalty" replace color="info">
        <FontAwesomeIcon icon="arrow-left" />
        &nbsp;
        <span className="d-none d-md-inline">
          <Translate contentKey="entity.action.back">Back</Translate>
        </span>
      </Button>
    </>);
  return (
    <>
      <form onSubmit={onSave}>
        <div className="flex flex-column gap-5">
          <h2>Edit Loyalty Points</h2>
          <div>
            <div>
              <label className="font-bold block mb-2">Name</label>
              <p>{record.customer?.firstName} {record.customer?.lastName}</p>
            </div>
            &nbsp;
            <div>
              <label className="font-bold block mb-2">Email</label>
              <p>{record.customer?.email}</p>
            </div>
          </div>
          <div>
            <label htmlFor="points" className="font-bold block mb-2">Points</label>
            <InputNumber inputId='points' placeholder="Points" minFractionDigits={2} maxFractionDigits={5} showButtons onChange={handlePointsChange} value={points}/>
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
            <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
              <FontAwesomeIcon icon="save" />
              &nbsp;
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </div>

        </div>
      </form>
    </>
  );
}
