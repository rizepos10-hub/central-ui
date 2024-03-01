import {Table} from "reactstrap";

import React, {useEffect} from "react";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {IBranch} from "app/shared/model/branch.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";

const OrderGeneralInfo = ({order}) => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const getBranchName = (branchId) => {
    const branch = branchList.find((branch: IBranch) => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, [])

  return (
    <Table>
      <thead>
      <tr>
        <th>Order Time</th>
        <th>POS User</th>
        <th>Order Status</th>
        <th>Branch</th>
      </tr>
      </thead>
      <tbody>
        <tr >
          <td>
            {order?.createdDate}
          </td>
          <td>
            {order?.createdBy}
          </td>
          <td>
            {order?.status}
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
