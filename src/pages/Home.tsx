import React from 'react'
import { FaGithub } from "react-icons/fa";
const Home = () => {
  return (
    <div className="flex justify-center h-screen w-full items-center">
      <button type="" className="flex justify-center items-center gap-4 bg-black text-white p-3 rounded-xl">
        <FaGithub /> Login with Github
      </button>
    </div>
  )
}

export default Home
