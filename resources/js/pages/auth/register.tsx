import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register" />

            <div className="mb-8 text-center">
                <h1 className="text-5xl leading-tight font-extrabold text-[#710006]">
                    GPS
                    <br />
                    Attendance
                </h1>

                <p className="mt-3 text-base text-gray-500">
                    Create your account
                </p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* NAME */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-base font-semibold text-[#710006]"
                                >
                                    Full Name
                                </Label>

                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            {/* EMAIL */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-base font-semibold text-[#710006]"
                                >
                                    Email Address
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError message={errors.email} />
                            </div>

                            {/* PASSWORD */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className="text-base font-semibold text-[#710006]"
                                >
                                    Password
                                </Label>

                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError message={errors.password} />
                            </div>

                            {/* CONFIRM PASSWORD */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-base font-semibold text-[#710006]"
                                >
                                    Confirm Password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* BUTTON */}
                            <Button
                                type="submit"
                                className="mt-2 h-14 w-full rounded-2xl bg-[#8b0008] text-base font-semibold text-white hover:bg-[#6f0006]"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create Account
                            </Button>
                        </div>

                        {/* LOGIN */}
                        <div className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-semibold text-[#710006]"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: '',
    description: '',
};
