import { ITill } from "app/shared/model/till.model";
import React from "react";
import { convertDateTimeFromServer } from "app/shared/util/date-utils";

const TillDetails = ({ till }: { till: ITill }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-2 mb-2 text-xs">
      <div className="space-y-1">
        <div className="flex gap-2">
          <span className="font-semibold min-w-[80px]">Register:</span>
          <span>{till.registry?.name}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-[80px]">Status:</span>
          <span>{till.status}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex gap-2">
          <span className="font-semibold min-w-[80px]">Opened:</span>
          <span>{convertDateTimeFromServer(till.startDate)}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-[80px]">Closed:</span>
          <span>{convertDateTimeFromServer(till.endDate)}</span>
        </div>
      </div>
    </div>
  );
}

export default TillDetails;
