import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IAttachment } from 'app/shared/model/attachment.model';
import {
  clampDisplaySeconds,
  IKioskSlide,
  IKioskSlidesSettingRequest,
  isKioskSlideAspectRatioValid,
  KIOSK_SLIDE_MAX_SECONDS,
  KIOSK_SLIDE_MIN_SECONDS,
  KIOSK_SLIDE_TARGET_HEIGHT,
  KIOSK_SLIDE_TARGET_WIDTH,
  loadImageDimensions,
  normalizeKioskSlidesSettingValue,
} from 'app/shared/model/kiosk-slides-setting.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKioskSlidesSetting, setSlides, updateKioskSlidesSetting } from './kiosk-slides.reducer';

const KioskSlidesSettings = () => {
  const dispatch = useAppDispatch();
  const branches = useAppSelector(state => state.branch.entities);
  const entity = useAppSelector(state => state.kioskSlidesSetting.entity);
  const loading = useAppSelector(state => state.kioskSlidesSetting.loading);
  const updating = useAppSelector(state => state.kioskSlidesSetting.updating);
  const updateSuccess = useAppSelector(state => state.kioskSlidesSetting.updateSuccess);

  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [pendingImage, setPendingImage] = useState<IAttachment[] | null>(null);
  const [pendingSeconds, setPendingSeconds] = useState<number>(KIOSK_SLIDE_MIN_SECONDS);

  const slides = normalizeKioskSlidesSettingValue(entity.value).slides || [];

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedBranchId && branches?.length > 0 && branches[0].id) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    dispatch(getKioskSlidesSetting(selectedBranchId));
  }, [dispatch, selectedBranchId]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('Kiosk slides saved.');
    }
  }, [updateSuccess]);

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const next = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    dispatch(setSlides(next));
  };

  const removeSlide = (index: number) => {
    dispatch(setSlides(slides.filter((_, i) => i !== index)));
  };

  const updateSlideSeconds = (index: number, seconds: number) => {
    const next = slides.map((slide, i) => (i === index ? { ...slide, displaySeconds: clampDisplaySeconds(seconds) } : slide));
    dispatch(setSlides(next));
  };

  const validateAndAddSlide = async () => {
    if (!pendingImage?.[0]?.url) {
      toast.error('Select an image before adding a slide.');
      return;
    }
    try {
      const { width, height } = await loadImageDimensions(pendingImage[0].url);
      if (!isKioskSlideAspectRatioValid(width, height)) {
        toast.error(
          `Image aspect ratio must match ${KIOSK_SLIDE_TARGET_WIDTH}×${KIOSK_SLIDE_TARGET_HEIGHT} (ratio ${(KIOSK_SLIDE_TARGET_WIDTH / KIOSK_SLIDE_TARGET_HEIGHT).toFixed(3)}). Selected image is ${width}×${height}.`
        );
        return;
      }
      const newSlide: IKioskSlide = {
        image: pendingImage[0],
        displaySeconds: clampDisplaySeconds(pendingSeconds),
      };
      dispatch(setSlides([...slides, newSlide]));
      setPendingImage(null);
      setPendingSeconds(KIOSK_SLIDE_MIN_SECONDS);
    } catch {
      toast.error('Could not validate image dimensions.');
    }
  };

  const save = async () => {
    if (!selectedBranchId) {
      toast.error('Select a branch.');
      return;
    }
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i]?.image?.url) {
        toast.error(`Slide ${i + 1} is missing an image.`);
        return;
      }
    }
    const request: IKioskSlidesSettingRequest = {
      branchId: selectedBranchId,
      value: { slides },
    };
    try {
      await dispatch(updateKioskSlidesSetting(request)).unwrap();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save kiosk slides.');
    }
  };

  return (
    <PageWrapper>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h4 className="text-lg font-semibold mb-0">Kiosk Slides</h4>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="max-w-md h-8 text-xs">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches?.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Add slide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload images matching aspect ratio {KIOSK_SLIDE_TARGET_WIDTH}×{KIOSK_SLIDE_TARGET_HEIGHT}. Display time: {KIOSK_SLIDE_MIN_SECONDS}–{KIOSK_SLIDE_MAX_SECONDS} seconds.
          </p>
          <MediaLibrary
            handleFilesSelectCallback={files => setPendingImage(transformAttachmentStructure(files, 'toIAttachment'))}
            defaultValues={transformAttachmentStructure(pendingImage, 'toFileLibraryListItem')}
          />
          <div className="flex items-center gap-2 max-w-xs">
            <Label className="text-xs whitespace-nowrap">Display seconds</Label>
            <Input
              type="number"
              min={KIOSK_SLIDE_MIN_SECONDS}
              max={KIOSK_SLIDE_MAX_SECONDS}
              value={pendingSeconds}
              onChange={e => setPendingSeconds(clampDisplaySeconds(Number(e.target.value)))}
              className="h-8 text-xs"
            />
          </div>
          <Button onClick={validateAndAddSlide} disabled={!pendingImage?.length} className="h-8 text-xs">
            Add slide
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Slides ({slides.length})</CardTitle>
          <Button onClick={save} disabled={updating || loading} className="h-8 text-xs">
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {slides.length === 0 && <p className="text-xs text-muted-foreground">No slides configured for this branch.</p>}
          {slides.map((slide, index) => (
            <div key={`${slide.image?.id || slide.image?.url}-${index}`} className="border rounded-md p-3 flex gap-3 items-start">
              <img
                src={slide.image?.url}
                alt={`Slide ${index + 1}`}
                className="w-32 h-40 object-cover rounded border"
              />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">Slide {index + 1}</div>
                <div className="flex items-center gap-2 max-w-xs">
                  <Label className="text-xs whitespace-nowrap">Seconds</Label>
                  <Input
                    type="number"
                    min={KIOSK_SLIDE_MIN_SECONDS}
                    max={KIOSK_SLIDE_MAX_SECONDS}
                    value={slide.displaySeconds ?? KIOSK_SLIDE_MIN_SECONDS}
                    onChange={e => updateSlideSeconds(index, Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7" disabled={index === 0} onClick={() => moveSlide(index, 'up')}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7" disabled={index === slides.length - 1} onClick={() => moveSlide(index, 'down')}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button variant="destructive" size="sm" className="h-7" onClick={() => removeSlide(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default KioskSlidesSettings;
