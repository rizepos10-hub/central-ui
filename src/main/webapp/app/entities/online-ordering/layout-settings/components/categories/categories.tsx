import React from 'react'
import { ITerm } from 'app/shared/model/term.model'
import { Layout } from 'app/shared/model/ENUMS/layout.model'
import LayoutOne from './layout-one/layout-one'

const CategoriesLayout = ({
    layout,
    categories
}: {
    layout: Layout
    categories: ITerm[]
}) => {
    switch (layout) {
        case Layout.layoutOne:
            return <LayoutOne categories={categories}/>
        case Layout.layoutTwo:
            // return <LayoutTwo />
            return <div>1</div>
        default:
            return <LayoutOne categories={categories}/>
    }
}

export default CategoriesLayout