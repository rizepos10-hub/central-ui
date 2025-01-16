import { Button, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import React, { useEffect, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Translate } from "react-jhipster";
import { IPricingPoint } from "app/shared/model/PRICING-POINT/pricing-point";
import { IPricingPointBranchPrice } from "app/shared/model/ITEM/retail/variable-item.model";

type ModalProps = {
    toggle: () => void;
    isOpen: boolean;
    pricingPoints: IPricingPoint[];
    branchId: string;
    variant: any
    setItem: React.Dispatch<React.SetStateAction<any>>;
};

const PricingPointModal = ({
    toggle,
    isOpen,
    pricingPoints,
    branchId,
    variant,
    setItem,
}: ModalProps) => {
    const handleClose = () => {
        toggle();
    };
    console.log(variant, 'qdqwdqwvariant')

    const handlePriceChange = (pricingPoint: IPricingPoint, value: number) => {
        setItem(prev => ({
          ...prev,
          variants: prev.variants.map(v => {
            if (v.id === variant.id) {
              const existingIndex = v.pricingPointBranchPrices.findIndex(
                ppbp =>
                  ppbp.pricingPoint.id === pricingPoint.id &&
                  ppbp.branch?.id === branchId
              );
      
              const updatedPricingPointBranchPrices =
                existingIndex !== -1
                  ? v.pricingPointBranchPrices.map((ppbp, idx) =>
                      idx === existingIndex
                        ? {
                            ...ppbp,
                            price: value,
                            branch: { id: branchId },
                          }
                        : ppbp
                    )
                  : [
                      ...v.pricingPointBranchPrices,
                      {
                        branch: { id: branchId },
                        pricingPoint,
                        price: value,
                      },
                    ];
      
              return {
                ...v,
                pricingPointBranchPrices: updatedPricingPointBranchPrices,
              };
            }
            return v;
          }),
        }));
      };
      

    const handleSave = () => {
        toggle();
        // const result = pricingPoints.map(pp => ({
        //     branch: { id: branchId },
        //     pricingPoint: pp,
        //     price: variant.pricingPointBranchPrices.find(ppbp => ppbp.pricingPoint.id === pp.id)?.price || 0,
        // }));

        return
    };
    console.log(variant.pricingPointBranchPrices, 'variant.pricingPointBranchPrices')
    return (
        <Modal size="l" isOpen={isOpen} toggle={toggle}>
            <ModalHeader toggle={toggle}>Pricing Points</ModalHeader>
            <FormGroup>
                <ModalBody>
                    <div className="d-flex flex-column gap-2">
                        {pricingPoints.map(pricingPoint => (
                            <div
                                key={pricingPoint.id}
                                className="d-flex align-items-center justify-content-between"
                            >
                                <Label className="mb-0">{pricingPoint.name}</Label>
                                <InputNumber
                                    min={0}
                                    maxFractionDigits={2}
                                    value={variant?.pricingPointBranchPrices.find(ppbp => ppbp.pricingPoint.id === pricingPoint.id && ppbp.branch?.id === branchId)?.price || 0}
                                    onChange={e => handlePriceChange(pricingPoint, e.value)}
                                />
                            </div>
                        ))}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={handleClose}>
                        <Translate contentKey="entity.action.cancel">Cancel</Translate>
                    </Button>
                    <Button color="primary" onClick={handleSave}>
                        Save
                    </Button>
                </ModalFooter>
            </FormGroup>
        </Modal>
    );
};

export default PricingPointModal;