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
        const newSocialProfilesValues = {
            ...socialProfiles, [field]: {
                ...socialProfiles[field],
                url: value,
                name: field
            }
        };
        dispatch(changeLayoutField({ name: "socialProfiles", value: newSocialProfilesValues }));
    };

    const socials = [{
        key: 'INSTAGRAM',
        label: 'Instagram'
    }, {
        key: 'FACEBOOK',
        label: 'Facebook'
    }, {
        key: 'TIKTOK',
        label: 'Tiktok'
    }, {
        key: 'TWITTER',
        label: 'Twitter'
    }, {
        key: 'YOUTUBE',
        label: 'Youtube'
    }, {
        key: 'LINKEDIN',
        label: 'Linkedin'
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
                        value={socialProfiles[social.key]?.url || ''}
                        onChange={(e) => handleChange(`${social.key}` as keyof ILayoutSettings["socialProfiles"], e.target.value)}
                    />
                </FormGroup>
            ))}
        </>
    );
}

export default SocialProfiles