import React from 'react'
import "./layout-one.css"
import { ITerm } from 'app/shared/model/term.model'

const LayoutOne = ({
    categories
}: {
    categories: ITerm[]
}) => {
    return (
        <div className='categories_container'>
            <div className='vertical_layout_container'>
                <CardVertical category={categories[0]} />
                <CardVertical category={categories[1]} />
                <CardVertical category={categories[2]} />
            </div>
            <div className='horizontal_layout_container'>
                <CardHorizontal category={categories[3]} />
                <CardHorizontal category={categories[4]} />
            </div>
        </div>
    )
}

const CardVertical = ({
    category
}: {
    category: ITerm
}) => {
    return (
        <div className='vertical_card'>
            <div className="card_content">
                <img
                    alt="Category"
                    src={category?.attachments[0]?.url || 'https://via.placeholder.com/300'}
                    className='card_image'
                />
            </div>
        </div>
    )
}

const CardHorizontal = ({
    category
}: {
    category: ITerm
}) => {
    return (
        <div className='horizontal_card_container'>
            <div className="card_content">
                <img
                    alt="Category"
                    src={category?.attachments[0]?.url || 'https://via.placeholder.com/300'}
                    className='card_image'
                />
            </div>
        </div>
    )
}

export default LayoutOne