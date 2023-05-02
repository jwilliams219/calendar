import { useState } from 'react'
import { auth} from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function signUp() {
        createUserWithEmailAndPassword(auth, email, password)
            .then(({user}) => {
                //console.log(user);
            })
    }
    
    function login() {
        signInWithEmailAndPassword(auth, email, password) 
            .then(({user}) => {
                //console.log(user)
            })
    }

    return (
        <div className="container">
            <div className="login">
            <h4>Login / Create Account</h4>
            <input type = "email" value={email} onChange={e => setEmail(e.target.value)} placeholder='email'></input>
            <input type="password" value = {password} onChange={e => setPassword(e.target.value)} placeholder='password'></input>
            <div className='login-controls'>
                <button onClick={login}>Sign In</button>
                <button className='secondary' onClick={signUp}>Create Account</button>
            </div>
            </div>
        </div>
    )

}