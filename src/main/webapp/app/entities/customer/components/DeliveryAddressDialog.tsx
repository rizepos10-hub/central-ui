import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ControlPosition, Map, MapControl, Marker } from '@vis.gl/react-google-maps';
import { useAppDispatch } from 'app/config/store';
import { updateEntity } from 'app/entities/customer/customer.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { AddressTypeEnum, IAddress } from 'app/shared/model/address.model';
import { PlaceAutocompleteClassic } from 'app/shared/components/google/autocomplete-classic';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'app/shared/components/select/select';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DeliveryAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: ICustomer | null;
  address?: IAddress | null;
  onSaved?: (address: IAddress, customer: ICustomer) => void;
}

const emptyAddress: IAddress = {
  addressType: AddressTypeEnum.Home,
};

const DeliveryAddressDialog = ({
  open,
  onOpenChange,
  customer,
  address,
  onSaved,
}: DeliveryAddressDialogProps) => {
  const dispatch = useAppDispatch();
  const [currentAddress, setCurrentAddress] = useState<IAddress>(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Create a clean address object with only serializable properties
    if (address) {
      const cleanedAddress: IAddress = {
        id: address.id,
        address: address.address,
        addressType: address.addressType,
        contactPersonName: address.contactPersonName,
        phoneNumber: address.phoneNumber,
        floor: address.floor,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        // Convert to numbers if they're strings (API sometimes returns strings)
        latitude: typeof address.latitude === 'string' ? parseFloat(address.latitude) : address.latitude,
        longitude: typeof address.longitude === 'string' ? parseFloat(address.longitude) : address.longitude,
      };
      setCurrentAddress(cleanedAddress);
    } else {
      setCurrentAddress({ ...emptyAddress });
    }
  }, [address, open]);

  const mapCenter = useMemo(() => {
    const lat = typeof currentAddress.latitude === 'number' ? currentAddress.latitude : 
                (currentAddress.latitude != null ? parseFloat(String(currentAddress.latitude)) : null);
    const lng = typeof currentAddress.longitude === 'number' ? currentAddress.longitude : 
                (currentAddress.longitude != null ? parseFloat(String(currentAddress.longitude)) : null);
    
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return { lat: 0, lng: 0 };
  }, [currentAddress.latitude, currentAddress.longitude]);

  const addressTypeOptions = useMemo(
    () => Object.values(AddressTypeEnum).map(type => ({ value: type, label: type })),
    []
  );

  const handleAddressChange = useCallback((field: keyof IAddress, value: any) => {
    setCurrentAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleMapClick = useCallback((event: any) => {
    const latLng = event?.detail?.latLng;
    if (!latLng) return;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    setCurrentAddress(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult | null) => {
    if (!place) return;
    const formattedAddress = place.formatted_address || place.name || '';
    const lat = place.geometry?.location?.lat?.();
    const lng = place.geometry?.location?.lng?.();
    setCurrentAddress(prev => ({
      ...prev,
      address: formattedAddress || prev.address,
      latitude: typeof lat === 'number' ? lat : prev.latitude,
      longitude: typeof lng === 'number' ? lng : prev.longitude,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!customer) return;
    setSaving(true);
    
    // Ensure currentAddress is clean and serializable
    const updatedAddress: IAddress = {
      id: currentAddress.id || uuidv4(),
      address: currentAddress.address,
      addressType: currentAddress.addressType,
      contactPersonName: currentAddress.contactPersonName,
      phoneNumber: currentAddress.phoneNumber,
      floor: currentAddress.floor,
      street: currentAddress.street,
      city: currentAddress.city,
      state: currentAddress.state,
      postalCode: currentAddress.postalCode,
      country: currentAddress.country,
      latitude: currentAddress.latitude,
      longitude: currentAddress.longitude,
    };

    const updatedAddresses = [...(customer.deliveryAddresses || [])];
    if (updatedAddress.id) {
      const index = updatedAddresses.findIndex(item => item.id === updatedAddress.id);
      if (index !== -1) {
        updatedAddresses[index] = updatedAddress;
      } else {
        updatedAddresses.push(updatedAddress);
      }
    } else {
      updatedAddresses.push(updatedAddress);
    }

    // Create customer object with only the necessary fields - let cleanEntity and axios handle serialization
    const updatedCustomer: ICustomer = {
      ...customer,
      deliveryAddresses: updatedAddresses,
    };

    // If customer has an ID, save via API; otherwise, just update local state
    if (customer.id) {
      const result = await dispatch(updateEntity(updatedCustomer));
      if (updateEntity.fulfilled.match(result)) {
        onSaved?.(updatedAddress, result.payload.data);
        onOpenChange(false);
      }
    } else {
      // For new customers, just call the callback with local state
      onSaved?.(updatedAddress, updatedCustomer);
      onOpenChange(false);
    }
    setSaving(false);
  }, [currentAddress, customer, dispatch, onOpenChange, onSaved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Delivery Address</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Search location</Label>
              <div className="rounded-md border border-input px-2 py-1 text-xs">
                <PlaceAutocompleteClassic onPlaceSelect={handlePlaceSelect} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Address</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress.address || ''}
                onChange={e => handleAddressChange('address', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Address Type</Label>
              <Select
                options={addressTypeOptions}
                value={addressTypeOptions.find(option => option.value === currentAddress.addressType) || null}
                onChange={(option) => handleAddressChange('addressType', option?.value)}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Country</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.country || ''}
                  onChange={e => handleAddressChange('country', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">City</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.city || ''}
                  onChange={e => handleAddressChange('city', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">State</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.state || ''}
                  onChange={e => handleAddressChange('state', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Postal Code</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.postalCode || ''}
                  onChange={e => handleAddressChange('postalCode', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Street</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.street || ''}
                  onChange={e => handleAddressChange('street', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Floor</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.floor || ''}
                  onChange={e => handleAddressChange('floor', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Contact Name</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.contactPersonName || ''}
                  onChange={e => handleAddressChange('contactPersonName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  className="h-8 text-xs"
                  value={currentAddress.phoneNumber || ''}
                  onChange={e => handleAddressChange('phoneNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Latitude</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={currentAddress.latitude ?? ''}
                  onChange={e => handleAddressChange('latitude', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Longitude</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={currentAddress.longitude ?? ''}
                  onChange={e => handleAddressChange('longitude', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Pin location (click to set)</Label>
            <div className="h-[360px] w-full overflow-hidden rounded-md border border-border">
              <Map
                defaultZoom={mapCenter.lat !== 0 && mapCenter.lng !== 0 ? 14 : 3}
                defaultCenter={mapCenter}
                onClick={handleMapClick}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                style={{ width: '100%', height: '100%' }}
              >
                {mapCenter.lat !== 0 && mapCenter.lng !== 0 && (
                  <Marker position={mapCenter} />
                )}
                <MapControl position={ControlPosition.TOP_CENTER}>
                  <div className="rounded bg-white/90 px-2 py-1 text-[10px] text-muted-foreground shadow">
                    Click on the map to set latitude/longitude.
                  </div>
                </MapControl>
              </Map>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!customer || saving}
            className="h-8 text-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryAddressDialog;
