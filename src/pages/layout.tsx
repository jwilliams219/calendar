import { useEffect, useState } from "react";
import {Outlet, useNavigate} from "react-router-dom";
import UserContext, { User } from "../context/user";
import {auth} from "../lib/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";

export const Layout = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    function logOut() {
        auth.signOut();
        setLoggedIn(false);
        //location.reload();
    }

    useEffect(() => {
        const cleanup = onAuthStateChanged(auth, (user) => {
            setLoading(false);
            if (user !== null) {
                setUser(user as User);
                setLoggedIn(!!user)
            } else {
                setUser(null);
                setLoggedIn(false);
            }
        })
        if (!loading) {
            navigate(loggedIn ? '/calendar' : '/login');
        }
        return cleanup;
    }, [loggedIn, loading]);

    return (
        <UserContext.Provider value={user}>
            { loggedIn ? <div className="log-out"><button onClick={logOut}>Log Out</button></div>
                : <div></div>
            }
            {loading ? <div>Loading...</div> : <Outlet />}
        </UserContext.Provider>
    )
}

