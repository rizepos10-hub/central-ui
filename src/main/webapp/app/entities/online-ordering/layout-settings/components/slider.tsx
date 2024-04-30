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
import Attachment from 'app/shared/components/attachment/attachment';
import { set } from 'lodash';
import { IAttachment } from 'app/shared/model/attachment.model';

const Slider = ({
    sliderSettings,
}: {
    sliderSettings: ILayoutSettings["sliderSettings"];
}) => {
    const dispatch = useAppDispatch();
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [animating, setAnimating] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState(false);

    const [image, setImage] = useState<IAttachment | null>(null);
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

    const handleImageChange = () => {
        const newSlider: ISliderSettings = {
            image,
            text,
            buttonSetting: {
                text: '',
                color: '',
                alignment: buttonSettingsAlignment.CENTER
            }
        };
        setActiveIndex(sliderSettings.length);
        dispatch(changeLayoutField({ name: "sliderSettings", value: [...sliderSettings, newSlider] }));
        setImage(null);
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
                <Attachment
                    image={image}
                    onRemoveImage={() => setImage(null)}
                    onAddImage={(imageInfo) => setImage(imageInfo)}
                />
                <InputText
                    placeholder="Enter text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button
                    color="primary"
                    onClick={handleImageChange}
                    disabled={!image}
                >
                    Add Slide
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
                    </div>
                </>
            )}
        </div>
    )
}

export default Slider