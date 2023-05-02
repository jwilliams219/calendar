import { Children, useLayoutEffect, useState, createContext } from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { Layout } from './pages/layout';
import { Login } from './pages/login';
import { UserCalendar } from './pages/userCalendar';
import './App.css'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'calendar',
        element: <UserCalendar />
      }
    ]
  }
]);

function App() {

  return (
    <RouterProvider router={router}/>
  )
}

export default App
