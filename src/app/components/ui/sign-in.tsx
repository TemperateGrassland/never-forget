
// // import magicLinkLogin from "../../../../server/actions/magic-link-login"
// // export default function SignIn(){
// //     return (
// //         <form action={magicLinkLogin}>
// //             <input type="email" placeholder="Email"/>
// //             <button type="submit">Sign In via Magic Links</button>
// //         </form>
// //     )
// // }
    
// import { signIn } from "@/lib/auth"
 
// export function SignIn() {
//   return (
//     <form
//       action={async (formData) => {
//         // "use server"
//         await signIn("email", formData)
//       }}
//     >
//       <input type="text" name="email" placeholder="Email" />
//       <button type="submit">Signin with Resend</button>
//     </form>
//   )
// }