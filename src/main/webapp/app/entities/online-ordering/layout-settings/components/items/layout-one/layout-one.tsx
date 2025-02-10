import React, { useState } from 'react'
import './layout-one.css'
import { IItem } from 'app/shared/model/ITEM/item.model'
import { Carousel, CarouselControl, CarouselItem } from 'reactstrap'

const LayoutOne = ({
    items
}: {
    items: IItem[]
}) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [animating, setAnimating] = useState<boolean>(false);

    const slides = items?.map((item, index) => (
        <CarouselItem
            key={index + 1}
            onExiting={() => setAnimating(true)}
            onExited={() => setAnimating(false)}
            style={{ position: 'relative' }}
        >
            <img
                src={item?.attachments?.[0]?.url || 'https://via.placeholder.com/300'}
                alt={`Preview ${index}`}
                style={{
                    width: '100%',
                    objectPosition: 'center center'
                }}
            />
        </CarouselItem>
    ));

    const next = () => {
        if (animating) return;
        const nextIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(nextIndex);
    };

    const previous = () => {
        if (animating) return;
        const nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
        setActiveIndex(nextIndex);
    };

    return (
        <div className='container'>
            <div className='text_container'>
                <div className='title'>
                    Commodo integer
                </div>
                <div className='subtitle_line_one'>
                    PROFESSIONAL
                </div>
                <div className='subtitle_line_two'>
                    SKINCARE
                </div>
                <div className='description'>
                    There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration.
                </div>
                <div className='button_text'>
                    Continue Shopping
                </div>
            </div>
            <Carousel activeIndex={activeIndex} next={next} previous={previous}>
                {slides}
                <CarouselControl direction="prev" directionText="Previous" onClickHandler={previous} />
                <CarouselControl direction="next" directionText="Next" onClickHandler={next} />
            </Carousel>
        </div >
    )
}

export default LayoutOne