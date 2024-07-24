import { ITill } from "app/shared/model/till.model";
import React from "react";
import { convertDateTimeFromServer } from "app/shared/util/date-utils";

const TillDetails = ({ till }: { till: ITill }) => {
  return (
        <div className={"flex flex-row mt-3"}>
          <div className="col-6">
            <div className="row">
              <div className="col-3 font-bold">Register:</div>
              <div className="col-6">{till.registry?.name}</div>
            </div>
            <div className="row">
              <div className="col-3 font-bold">Status:</div>
              <div className="col-6">{till.status}</div>
            </div>

          </div>
          <div className="col-6">
            <div className="row">
              <div className="col-3 font-bold">Opened:</div>
              <div className="col-6">{convertDateTimeFromServer(till.startDate)}</div>
            </div>
            <div className="row">
              <div className="col-3 font-bold">Closed:</div>
              <div className="col-6">{convertDateTimeFromServer(till.endDate)}</div>
            </div>

          </div>
        </div>
  );
}

export default TillDetails;
