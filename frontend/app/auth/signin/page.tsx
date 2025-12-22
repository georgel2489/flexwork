import * as React from 'react';
import type { AuthProvider } from '@toolpad/core';
import { SignInPage } from '@toolpad/core/SignInPage';
import { AuthError } from 'next-auth';
import { providerMap, signIn } from '../../../auth';
import ForgotPasswordLink from '../../components/auth/ForgotPasswordLink'

export default function SignIn() {
  return (
    <SignInPage
      providers={providerMap}
      signIn={async (
        provider: AuthProvider,
        formData: FormData,
        callbackUrl?: string,
      ) => {
        'use server';
        try {
          return await signIn(provider.id, {
            ...(formData && {
              email: formData.get('email'),
              password: formData.get('password'),
            }),
            redirectTo: '/',
          });
        } catch (error) {
          console.log("Sign in error:", error);
          if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
          }
          if (error instanceof AuthError) {
            return {
              error:
                error.type === 'CredentialsSignin'
                  ? 'Invalid credentials.'
                  : 'An error with Auth.js occurred.',
              type: error.type,
            };
          }
          return {
            error: 'Something went wrong.',
            type: 'UnknownError',
          };
        }
      }}
      slots={{
        forgotPasswordLink: ForgotPasswordLink,
      }}
    />
  );
}
