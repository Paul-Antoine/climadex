import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import './AddFactoryForm.css';
import { IFactory } from '@climadex/types';
import { Navigate } from 'react-router-dom';

async function createFactory(factory: IFactory) {
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(factory),
  };
  const response = await fetch('http://localhost:3000/factories', options);
  const data = await response.json();
  return data;
}

export function AddFactoryForm() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFactory>();

  const [formError, setFormError] = useState('');

  const [formSuccess, setFormSuccess] = useState(false);

  if (formSuccess) {
    return <Navigate to="/factories" />;
  }

  const onSubmit: SubmitHandler<IFactory> = async (data) => {
    try {
      createFactory(data);
      setFormSuccess(true);
    } catch (e: unknown) {
      console.log(e);
      setFormError('An error has occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} action="#">
      {formError && <p role="alert">An error occurred : {formError}</p>}
      {errors.factoryName && <p role="alert">{errors.factoryName.message}</p>}
      <label>
        Factory name :{' '}
        <input
          {...register('factoryName', {
            required: 'Please give the factory a name.',
          })}
        />
      </label>
      {errors.country && <p role="alert">{errors.country.message}</p>}
      <label>
        Country :{' '}
        <input
          {...register('country', { required: 'Please specify a country.' })}
        />
      </label>

      {errors.address && <p role="alert">{errors.address.message}</p>}
      <label>
        Address :{' '}
        <input
          {...register('address', { required: 'Please enter an address.' })}
        />
      </label>

      {errors.latitude && <p role="alert">{errors.latitude.message}</p>}
      <label>
        Latitude :{' '}
        <input
          type="text"
          {...register('latitude', {
            required: 'This field is required.',
            pattern: {
              value: /^(-)?(0|[1-9]\d*)(\.\d+)?$/,
              message: 'Please enter a valid latitude (-90...90).',
            },
            validate: {
              bounds: (value) =>
                (+value <= 90 && +value >= -90) ||
                'Please enter a valid latitude (-90...90).',
            },
          })}
        />
      </label>

      {errors.longitude && <p role="alert">{errors.longitude.message}</p>}
      <label>
        Longitude :{' '}
        <input
          type="text"
          {...register('longitude', {
            required: 'This field is required.',
            pattern: {
              value: /^(-)?(0|[1-9]\d*)(\.\d+)?$/,
              message: 'Please enter a valid longitude (-180...180).',
            },
            validate: {
              bounds: (value) =>
                (+value <= 180 && +value >= -180) ||
                'Please enter a valid longitude (-180...180).',
            },
          })}
        />
      </label>

      {errors.yearlyRevenue && (
        <p role="alert">{errors.yearlyRevenue.message}</p>
      )}
      <label>
        Yearly revenue :{' '}
        <input
          type="text"
          {...register('yearlyRevenue', {
            required: 'This field is required.',
            min: 1,
            pattern: {
              value: /^(0|[1-9]\d*)(\.\d+)?$/,
              message: 'Please enter a valid amount.',
            },
          })}
        />
      </label>

      <input type="submit" value="Add" />
    </form>
  );
}
