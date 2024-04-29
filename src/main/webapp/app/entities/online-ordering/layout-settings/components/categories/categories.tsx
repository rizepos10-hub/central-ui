import React from 'react'
import { ITerm } from 'app/shared/model/term.model'
import { CategoryLayout } from 'app/shared/model/ENUMS/categories-layout.model'
import LayoutOne from './layout-one/layout-one'

const CategoriesLayout = ({
    layout,
    categories
}: {
    layout: CategoryLayout
    categories: ITerm[]
}) => {
    switch (layout) {
        case CategoryLayout.layoutOne:
            return <LayoutOne categories={categories}/>
        case CategoryLayout.layoutTwo:
            // return <LayoutTwo />
            return <div>1</div>
        default:
            return <LayoutOne categories={categories}/>
    }
}

export default CategoriesLayout