import {Table} from "reactstrap";

import React, {useEffect} from "react";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {IBranch} from "app/shared/model/branch.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import { Tag } from "primereact/tag";
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

const OrderGeneralInfo = ({order}) => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const getBranchName = (branchId) => {
    const branch = branchList.find((branch: IBranch) => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, []);

  const getSeverity = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';

      case 'UNPAID':
        return 'danger';

      default:
        return null;
    }
  };
  const formatStatusLabel = (status) =>
    status
      ? status
          .toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '-';
  const statusBodyTemplate = () => {
    return <Tag value={formatStatusLabel(order?.paymentStatus)} severity={getSeverity(order?.paymentStatus)}></Tag>;
  };

  return (
    <Table>
      <thead>
      <tr>
        <th>Order Time</th>
        <th>POS User</th>
        <th>Processing Status</th>
        <th>Payment Status</th>
        <th>Branch</th>
      </tr>
      </thead>
      <tbody>
        <tr >
          <td>
            {formatDateForDisplay(order?.createdDate)}
          </td>
          <td>
            {order?.createdBy}
          </td>
          <td>
            {formatStatusLabel(order?.processingStatus)}
          </td>
          <td>
            {statusBodyTemplate()}
          </td>
          <td>
            {getBranchName(order?.branchId)}
          </td>

        </tr>
      </tbody>
    </Table>
  )
}
export default OrderGeneralInfo
