import { IPaymentMethodSetting } from 'app/shared/model/payment-method-setting.model';

const hasNumericOrder = (value?: number | null): value is number => typeof value === 'number' && !Number.isNaN(value);

export const sortPaymentMethodSettings = (settings: IPaymentMethodSetting[] = []) =>
  settings
    .map((setting, index) => ({ setting, index }))
    .sort((left, right) => {
      const leftOrder = left.setting.order;
      const rightOrder = right.setting.order;
      const leftHasOrder = hasNumericOrder(leftOrder);
      const rightHasOrder = hasNumericOrder(rightOrder);

      if (leftHasOrder && rightHasOrder) {
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return left.index - right.index;
      }

      if (leftHasOrder) {
        return -1;
      }

      if (rightHasOrder) {
        return 1;
      }

      return left.index - right.index;
    })
    .map(({ setting }) => setting);

export const assignSequentialPaymentMethodOrder = (settings: IPaymentMethodSetting[] = []) =>
  settings.map((setting, index) => ({
    ...setting,
    order: index,
  }));
