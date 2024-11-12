import { Button } from "primereact/button";
import React, { useState } from "react";
import { MdDeleteOutline } from "react-icons/md";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";

const ComboItemAddonDropDown = ({ itemAddons = [], variantAddons = [], selectedComboAddons, onAddAddon, onDeleteAddon, onIncrement = null, onDecrement = null }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allAddons = [...itemAddons, ...variantAddons];

  const toggle = () => setDropdownOpen(!dropdownOpen);

  const isAllAddonsSelected = allAddons.every((addon) => selectedComboAddons.some((comboAddon) => comboAddon?.addon?.id === addon?.id));

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownToggle disabled={allAddons.length < 1 || isAllAddonsSelected} caret>
        Add Addons
      </DropdownToggle>
      <DropdownMenu>
        {allAddons
          .filter((addon) => !selectedComboAddons.some((comboAddon) => comboAddon.addon?.id === addon?.id))
          .map((addon) => (
            <DropdownItem key={addon?.id} onClick={() => onAddAddon(addon)}>
              {addon.name}
            </DropdownItem>
          ))}
      </DropdownMenu>
      <div>
        {selectedComboAddons.map((comboAddon, index) => (
          <div key={comboAddon?.addon?.id} className="mt-2 d-flex flex-column gap-2">
            <div style={{ width: '130px', display: 'inline-block' }}>{comboAddon?.addon?.name}:</div>
            <div className="d-flex gap-2 align-items-center">
              <Button
                className="decrement-button p-2"
                style={{
                  width: "26px",
                  height: '26px'
                }}
                outlined
                onClick={() => onDecrement(index)}
                disabled={comboAddon?.addon?.amount <= 0}
              >
                -
              </Button>
              <span>
                {comboAddon?.amount || null}
              </span>
              <Button
                className="increment-button p-2"
                style={{
                  width: "26px",
                  height: '26px'
                }}
                outlined
                onClick={() => onIncrement(index)}
              >
                +
              </Button>
              <Button
                className="delete-button p-2"
                style={{
                  width: "26px",
                  height: '26px'
                }}
                outlined
                onClick={() => onDeleteAddon(index)}
              >
                X
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Dropdown>
  );
};

export default ComboItemAddonDropDown;
