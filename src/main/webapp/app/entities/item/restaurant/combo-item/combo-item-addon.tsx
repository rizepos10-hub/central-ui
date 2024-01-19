import React, { useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";

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
          <div key={comboAddon?.addon?.id} className="mt-2">
            <span style={{ width: '130px', display: 'inline-block' }}>{comboAddon?.addon?.name}:</span>
            <Button
              className="decrement-button"
              onClick={() => onDecrement(index)}
              style={{ display: 'inline-block', marginRight: '10px' }}
              disabled={comboAddon?.addon?.amount <= 0}
            >
              -
            </Button>
            <span className="p-3" style={{ display: 'inline-block' }}>
              {comboAddon?.amount}
            </span>
            <Button
              className="increment-button"
              onClick={() => onIncrement(index)}
              style={{ display: 'inline-block', marginLeft: '10px' }}
            >
              +
            </Button>
            <Button
              className="delete-button"
              onClick={() => onDeleteAddon(index)}
              style={{ display: 'inline-block', marginLeft: '10px' }}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </Dropdown>
  );
};

export default ComboItemAddonDropDown;
