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

    const slides = items.map((item, index) => (
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
            {/* <Carousel className="w-full my-4">
                <CarouselContent className="px-20 w-full hover:cursor-pointer">
                    {topItems.map((item, index) => (
                        <Dialog key={index}>
                            <DialogTrigger asChild>
                                <CarouselItem className='md:basis-1/2 lg:basis-1/3'>
                                    <VerticalCard
                                        item={item}
                                    />
                                </CarouselItem>
                            </DialogTrigger>
                            <DialogContent className='pt-10'>
                                <h4 className='text-3xl font-semibold'>Pick a branch</h4>
                                {branches.map((branch, index) => (
                                    <Link href={`/${branch.id}`} key={index}>
                                        <BranchCard branch={branch} />
                                    </Link>
                                ))}
                            </DialogContent>
                        </Dialog>
                    ))}
                </CarouselContent>
            </Carousel> */}
        </div >
    )
}

// const VerticalCard = ({
//     item
// }: {
//     item: IItem
// }) => {
//     return (
//         <div className="group relative h-full">
//             <div className="h-full flex flex-col justify-between pb-2 shadow-lg">
//                 <img

//                 />
//                 <div className="absolute top-1 right-1">
//                     {item.currentPrice ? (
//                         <Badge variant="destructive">SALE</Badge>
//                     ) : (
//                         <Badge variant="secondary">NEW</Badge>
//                     )}
//                 </div>
//                 <div className="p-4">
//                     <p className="text-sm text-gray-500">{item.variantName}</p>
//                     <h3 className="text-lg font-semibold">{item.itemName}</h3>
//                     <p className="text-lg font-bold">{item.price}</p>
//                 </div>
//             </div>
//         </div>
//     )
// }

export default LayoutOne