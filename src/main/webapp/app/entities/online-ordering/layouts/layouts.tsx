import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ILayouts, SelectedLayoutEnum } from 'app/shared/model/ONLINE_ORDERING/layouts/layouts.module';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { Checkbox } from 'primereact/checkbox';
import React from 'react'
import { Col, Label, Row } from 'reactstrap'
import { getEntity, updateEntity, reset, changeLayoutsField } from 'app/entities/online-ordering/settings/settings.reducer';

const Layouts = () => {
    const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);

    return (
        <div className="container mt-4">
            <Row>
                <Col md={4}><LayoutsCard layout={uiSettings.layouts} /></Col>
            </Row>
        </div>
    )
}

const LayoutsCard = ({
    layout
}: {
    layout: ILayouts
}) => {
    const dispatch = useAppDispatch();

    return (
        <>
            <div className="card mb-3" style={{ maxWidth: '540px' }}>
                <div className="row g-0">
                    <div className="col-md-12">
                        <img
                            src="https://via.placeholder.com/540x200"
                            className="img-fluid"
                            alt="Card background"
                        />
                    </div>
                </div>
            </div>
            <div className="form-check">
                <Checkbox
                    className="form-check-input"
                    type="checkbox"
                    id="checkMe"
                    value={layout.selectedLayout}
                    onChange={(e) => dispatch(changeLayoutsField({
                        name: 'selectedLayout',
                        value: SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA
                    }))}
                    checked={layout.selectedLayout === SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}
                />
                <Label className="form-check-label" htmlFor="checkMe">
                    Check me
                </Label>
            </div>
        </>
    )
}

export default Layouts