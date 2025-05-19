'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <div>
        <Link href="/">
            <Image
                src="/NeverForgetLogo.svg"
                alt="Go to homepage"
                width={250}
                height={250}
                className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-auto cursor-pointer"
                layout="intrinsic"
            />
        </Link>
    </div>
  )
}