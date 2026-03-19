import React, { useState, } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

function SignUp() {

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };
    const handleFNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
    };
    const handleLNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
    };
    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };
    const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
    };
    const handlePNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
    };
    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatusMessage(null);

        // Build query params to match server's current /SignUp GET handler
        const params = new URLSearchParams({
            username,
            firstName,
            lastName,
            email,
            address,
            phoneNumber,
            password,
        });

        try {
            const res = await fetch(`http://localhost:8080/SignUp?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                const data = await res.json();
                setStatusMessage('Sign up successful.');
                console.log('Saved student:', data);
            } else {
                const text = await res.text();
                setStatusMessage(`Sign up failed: ${text}`);
            }
        } catch (err: any) {
            setStatusMessage(`Error: ${err.message || err}`);
        }
    };

    return <div>
    <form id="my-form" onSubmit={handleSubmit}>
            <p>Username: </p>
            <input type="text" value={username} onChange={handleNameChange} required></input>
            <p>First Name: </p>
            <input type="text" value={firstName} onChange={handleFNChange} required></input>
            <p>Last Name: </p>
            <input type="text" value={lastName} onChange={handleLNChange} required></input>
            <p>Email: </p>
            <input type="email" value={email} onChange={handleEmailChange} required></input>
            <p>Address: </p>
            <input type="text" value={address} onChange={handleAddressChange} required></input>
            <p>Phone Number: </p>
            <input type="text" value={phoneNumber} onChange={handlePNChange} required></input>
            <p>Password: </p>
            <input type="password" value={password} onChange={handlePasswordChange} required></input><br></br>
            <input name="submit" type="submit" value="Sign Up"></input>
            {statusMessage && <p>{statusMessage}</p>}
        </form>
    </div>
}

export default SignUp