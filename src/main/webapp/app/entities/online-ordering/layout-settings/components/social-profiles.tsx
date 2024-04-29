import { useAppDispatch } from 'app/config/store'
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings'
import React from 'react'
import { translate } from 'react-jhipster'
import { FormGroup, Input, Label } from 'reactstrap'
import { changeLayoutField } from '../../settings/settings.reducer'

const SocialProfiles = ({
    socialProfiles
}: {
    socialProfiles: ILayoutSettings["socialProfiles"];
}) => {
    const dispatch = useAppDispatch();
    const handleChange = (field: keyof ILayoutSettings["socialProfiles"], value) => {
        const newSocialProfilesValues = { ...socialProfiles, [field]: value };
        dispatch(changeLayoutField({ name: "socialProfiles", value: newSocialProfilesValues }));
    };

    const socials = [{
        key: 'instagram',
        label: 'Instagram'
    }, {
        key: 'facebook',
        label: 'Facebook'
    }, {
        key: 'twitter',
        label: 'Tiktok'
    }, {
        key: 'twitter',
        label: 'Twitter'
    }, {
        key: 'youtube',
        label: 'Youtube'
    }]

    return (
        <>
            {socials.map((social, idx) => (
                <FormGroup key={idx}>
                    <Label for={social.key}>
                        {translate(`tempApp.layoutSettings.tabs.contactInfo.socials.${social.key}`)}
                    </Label>
                    <Input
                        type='text'
                        id={social.key}
                        name={social.key}
                        placeholder={`${social.label} URL`}
                        onChange={(e) => handleChange(`${social.key}_url` as keyof ILayoutSettings["socialProfiles"], e.target.value)}
                    />
                </FormGroup>
            ))}
        </>
    );
}

export default SocialProfiles