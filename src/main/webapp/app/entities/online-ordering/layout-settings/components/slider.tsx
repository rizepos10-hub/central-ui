import { InputNumber } from 'primereact/inputnumber';
import React, { useEffect, useState } from 'react'
import { FaDesktop, FaMobileAlt } from 'react-icons/fa';
import { translate } from 'react-jhipster';
import { Button, Carousel, CarouselControl, CarouselItem, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { useAppDispatch } from 'app/config/store';
import { ISliderSettings } from 'app/shared/model/ONLINE_ORDERING/slider-settings';
import { InputText } from 'primereact/inputtext';
import { buttonSettingsAlignment } from 'app/shared/model/ENUMS/button-settings-alignment';
import { changeLayoutField } from '../../settings/settings.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';

const Slider = ({
    sliderSettings,
}: {
    sliderSettings: ILayoutSettings["sliderSettings"];
}) => {
    const dispatch = useAppDispatch();
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [animating, setAnimating] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState(false);

    const [image, setImage] = useState<File | null>(null);
    const [text, setText] = useState<string>('');


    const next = () => {
        if (animating) return;
        const nextIndex = activeIndex === sliderSettings.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(nextIndex);
    };

    const previous = () => {
        if (animating) return;
        const nextIndex = activeIndex === 0 ? sliderSettings.length - 1 : activeIndex - 1;
        setActiveIndex(nextIndex);
    };

    useEffect(() => {
        if (sliderSettings.length === 0) {
            setActiveIndex(0);
        } else if (activeIndex >= sliderSettings.length) {
            setActiveIndex(sliderSettings.length - 1);
        }
    }, [sliderSettings, activeIndex]);

    const slides = sliderSettings.map((slider, index) => (
        <CarouselItem
            key={index + 1}
            onExiting={() => setAnimating(true)}
            onExited={() => setAnimating(false)}
            style={{
                display: 'flex !important',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <img
                src={slider.image?.url}
                alt={`Preview ${index}`}
                style={{
                    width: '100%',
                    height: isMobileView ? '70vh' : '50vh',
                    objectFit: isMobileView ? 'cover' : 'fill',
                    objectPosition: 'center center'
                }}
            />
            <Button
                color="danger"
                onClick={() => dispatch(changeLayoutField({ name: "sliderSettings", value: sliderSettings.filter((_, i) => i !== index) }))}
                style={{
                    marginTop: '10px',
                    width: '100%',
                }}
            >
                Remove this slide
            </Button>
        </CarouselItem>
    ));

    const handleImageChange = async (file: File | null, sliderText: string) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            const response: any = await dispatch(uploadImage(formData));
            const imageUrl = response?.payload?.url;
            const imageInfo = {
                id: response?.payload?.id,
                name: response?.payload?.name,
                path: response?.payload?.path,
                size: response?.payload?.size,
                type: response?.payload?.type,
                createdAt: response?.payload?.createdAt,
                updatedAt: response?.payload?.updatedAt,
                url: imageUrl,
            };

            const newSlider: ISliderSettings = {
                image: imageInfo,
                text: sliderText,
                buttonSetting: {
                    text: '',
                    color: '',
                    alignment: buttonSettingsAlignment.CENTER
                }
            };
            setActiveIndex(sliderSettings.length);
            dispatch(changeLayoutField({ name: "sliderSettings", value: [...sliderSettings, newSlider] }));
            return;
        } catch (error) {
            console.error('Error uploading image:', error);

            return;
        }
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: isMobileView ? '300px' : '100%',
        width: '100%',
        margin: '0 auto',
        transition: 'max-width 0.3s ease',
    };

    return (
        <div>
            <FormGroup style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <Input
                    type="file"
                    id="imageUpload"
                    onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                />
                <InputText
                    placeholder="Enter text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button
                    color="primary"
                    onClick={handleImageChange.bind(null, image, text)}
                    disabled={!image}
                >
                    Add Image
                </Button>
            </FormGroup>

            {sliderSettings && sliderSettings.length > 0 && (
                <>
                    <div style={{
                        marginTop: '20px',
                        marginBottom: "20px",
                        textAlign: 'center',
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <h3>
                            {translate('tempApp.layoutSettings.tabs.slider.preview')}
                        </h3>
                        <div style={{
                            textAlign: 'center',
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px"
                        }}>
                            <Button color={isMobileView ? "primary" : "secondary"} onClick={() => setIsMobileView(true)}>
                                <FaMobileAlt />
                            </Button>
                            <Button color={isMobileView ? "secondary" : "primary"} onClick={() => setIsMobileView(false)}>
                                <FaDesktop />
                            </Button>
                        </div>
                    </div>

                    <div style={containerStyle}>
                        <Carousel activeIndex={activeIndex} next={next} previous={previous}>
                            {slides}
                            <CarouselControl direction="prev" directionText="Previous" onClickHandler={previous} />
                            <CarouselControl direction="next" directionText="Next" onClickHandler={next} />
                        </Carousel>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px"
                    }}>
                        {/* <InputNumber
                            placeholder="Enter number to remove"
                            value={indexToRemove !== null ? indexToRemove : null}
                            onChange={handleIndexToRemoveChange}
                        />
                        <Button color="danger" onClick={handleImageRemove}>Remove Image</Button>
                        <Button color="danger" onClick={() =>
                            dispatch(changeEntityField({ name: "slider_images", value: [] }))
                        }>Remove All Images</Button> */}
                    </div>
                </>
            )}
        </div>
    )
}

export default Slider