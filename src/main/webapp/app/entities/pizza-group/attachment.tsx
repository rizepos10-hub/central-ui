import { ValidatedField } from "react-jhipster";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";
import { uploadImage } from "app/entities/attachment/attachment.reducer";
import { useAppDispatch } from "app/config/store";

const Attachment = ({ image, onRemoveImage, onAddImage, type }) => {
  const dispatch = useAppDispatch();



  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      console.error('No image selected.');
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response :any = await dispatch(uploadImage(formData));
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
      onAddImage(imageInfo, `${type === 'Builder' ? 'builderImage' : 'icon'}`)
      console.log(imageInfo, 'helloi');
      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  return (
    <div className="mb-3">
      <ValidatedField
        label={`${type} Image`}
        id="builder-image"
        name="image"
        data-cy="image"
        type="file"
        onChange={handleImageChange}
        accept="image/*"
      />
      <div className="mb-3">
        {image && (
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <img
              src={image.url}
              alt={image.name}
              className="img-fluid"
              style={{
                maxWidth: '100px',
                maxHeight: '100px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50%',
                padding: '2px',
                cursor: 'pointer',
              }}
              onClick={() => onRemoveImage(`${type === 'Builder' ? 'builderImage' : 'icon'}`)}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attachment;
