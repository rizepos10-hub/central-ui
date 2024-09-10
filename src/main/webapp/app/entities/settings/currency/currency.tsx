import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getCurrencies } from './currencies.reducer';
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { ICurrencySettings } from "app/shared/model/CURRENCY/currency-settings.model";
import { ICurrency } from "app/shared/model/CURRENCY/currency.model";
import { InputNumber } from "primereact/inputnumber";
import { Alert, Col, Row, Table } from "reactstrap";
import { Button } from "primereact/button";
import Select from "react-select";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { IBranch } from "app/shared/model/branch.model";
import { getEntity, updateEntity } from "app/entities/settings/currency/currency-settings.reducer";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';


export const Currency = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const currencies = useAppSelector(state => state.currencies.entities);
  const branchList = useAppSelector(state => state.branch.entities);
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);
  const loading = useAppSelector(state => state.currencySettings.loading);


  const [defaultCurrency, setDefaultCurrency] = useState<ICurrency>(null)
  const [currencySettings, setCurrencySettings] = useState<ICurrencySettings>({
    exchangeRates: [],
  });


  const exchangeRatesArray = currencySettings?.exchangeRates || [];
  const currenciesSet = new Set(exchangeRatesArray.map(option => option.currency));

  const filteredExchangeCurrencies = currencies?.filter(currency => !currenciesSet.has(currency));


  console.log(currencySettings, 'currencySettings')

  const confirm1 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => handleSetDefaultCurrency()
    });
  };

  const handleSetDefaultCurrency = () => {
    handleCurrencyChange(defaultCurrency, "defaultCurrency");
  }

  const handleAddExchangeRate = () => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates, { currency: null, rate: null }];
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleRemoveExchangeRate = (index: number) => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates.slice(0, index), ...prevSettings.exchangeRates.slice(index + 1)];
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleExchangeRateChange = (index: number, field: string, value: ICurrency | number) => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates];
      updatedExchangeRates[index] = { ...updatedExchangeRates[index], [field]: value };
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleBranchCurrencyChange = (index: number, field: string, value: ICurrency | IBranch) => {
    setCurrencySettings((prevSettings) => {
      const updatedBranchCurrencies = [...prevSettings.branchDisplayCurrencies];
      updatedBranchCurrencies[index] = { ...updatedBranchCurrencies[index], [field]: value };
      return { ...prevSettings, branchDisplayCurrencies: updatedBranchCurrencies };
    });
  };



  useEffect(() => {
    dispatch(getCurrencies({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getEntity());


  }, []);

  useEffect(() => {
    const existingBranches = currencySettingsEntity?.branchDisplayCurrencies?.map(bc => bc.branch.id) || [];
    const missingBranches = branchList?.filter(branch => !existingBranches.includes(branch.id)) || [];

    const defaultBranchDisplayCurrencies = [
      ...currencySettingsEntity?.branchDisplayCurrencies || [],
      ...missingBranches.map(branch => ({ branch, currency: null }))
    ];

    setCurrencySettings({
      ...currencySettingsEntity,
      branchDisplayCurrencies: defaultBranchDisplayCurrencies
    });
  }, [currencySettingsEntity, branchList]);


  const handleCurrencyChange = (selectedCurrency, currencyField) => {
    setCurrencySettings((prevState) => ({
      ...prevState,
      [currencyField]: selectedCurrency
    }))
  };

  const handleSave = () => {
    const assignedBranchesCurrencies = currencySettings?.branchDisplayCurrencies?.filter((branchCur) => branchCur?.currency)
    const entity = {
      ...currencySettings,
      branchDisplayCurrencies: assignedBranchesCurrencies
    }
    dispatch(updateEntity(entity))
  }

  const selectedCurrencyTemplate = (option: ICurrency, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>{option.name} ({option.code})</div>
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  const currencyOptionTemplate = (option: ICurrency) => {
    return (
      <div className="flex align-items-center">
        <div>{option.name} ({option.code})</div>
      </div>
    );
  };


  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            Currency Settings
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 gap-5  bg-white">
          <Alert className={"alert-warning"}>Kindly be advised that after the implementation of the default currency, any alterations or modifications become permanent and cannot be reversed.</Alert>
          <div className={"d-flex gap-2 w-auto"}>
            <label className={"text-xl mt-2 font-bold"}>
              Default Currency:
            </label>
            <Select
              value={currencySettings?.defaultCurrency ?? defaultCurrency}
              options={currencies}
              placeholder="Select a Currency"
              isDisabled={currencySettings?.defaultCurrency !== null}
              onChange={(currency) => setDefaultCurrency(currency)}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.code}
            />
            {currencySettings?.defaultCurrency === null ?
              <Button
                raised
                disabled={defaultCurrency === null}
                onClick={confirm1}>
                Set Default Currency
              </Button> : null}

          </div>

          <div className={"d-flex gap-2 w-auto"} >
            <label className={"text-xl mt-2 font-bold"}>
              Display Currency:
            </label>

            <Select
              value={currencySettings?.displayCurrency}
              onChange={(currency) => handleCurrencyChange(currency, "displayCurrency")}
              options={currencies}
              isClearable
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  minWidth: '10rem',
                }),
              }}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.code}
              placeholder="Select a Currency"
            />
          </div>

          <div className={"d-flex flex-column gap-2 w-auto mt-2"}>
            <div className={"d-flex justify-content-between"}>
              <label className={"text-xl mt-2 font-bold"}>
                Exchange Rates
              </label>
              <Button onClick={handleAddExchangeRate}>Add Exchange Rate</Button>
            </div>

            <Table bordered >
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {currencySettings?.exchangeRates?.map((exchangeRate, index) => {
                  const { currency } = exchangeRate
                  console.log(currency, 'currency')
                  return (
                    <tr key={index}>
                      <td>
                        <Select
                          value={currency}
                          onChange={(selectedCurrency) => handleExchangeRateChange(index, 'currency', selectedCurrency)}
                          options={filteredExchangeCurrencies}
                          placeholder="Select a Currency"
                          getOptionLabel={option => option.name}
                          getOptionValue={option => option.code}
                        />
                      </td>
                      <td>
                        {currency?.code &&
                          <InputNumber
                            value={exchangeRate.rate}
                            onChange={(e) => handleExchangeRateChange(index, 'rate', e.value)}
                            mode="currency"
                            inputId={currency.code}
                            currency={currency.code}
                          />}
                      </td>
                      <td>
                        <Button severity={"danger"} onClick={() => handleRemoveExchangeRate(index)}>Remove</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>

          <div className={"d-flex flex-column gap-2 w-auto mt-2"}>
            <label className={"text-xl mt-2 font-bold"}>
              Branches Currencies
            </label>

            <Table bordered >
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {currencySettings?.branchDisplayCurrencies?.map((branchCurrency, index) => {
                  return (
                    <tr key={index}>
                      <td>
                        {branchCurrency?.branch?.name}
                      </td>
                      <td>
                        <Dropdown
                          value={branchCurrency?.currency}
                          onChange={(e: DropdownChangeEvent) => handleBranchCurrencyChange(index, 'currency', e.value)}
                          options={currencies}
                          optionLabel="name"
                          placeholder="Select a Currency"
                          filter
                          showClear
                          valueTemplate={selectedCurrencyTemplate}
                          itemTemplate={currencyOptionTemplate}
                        />
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <div className="d-flex justify-content-end align-items-end">
              <Button label="Save" onClick={handleSave} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Currency;
