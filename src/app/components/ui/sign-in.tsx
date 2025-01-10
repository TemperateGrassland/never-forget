import magicLinkLogin from "../../../../server/actions/magic-link-login"
export default function SignIn(){
    return (
        <form action={magicLinkLogin}>
            <input type="email" placeholder="Email"/>
            <button type="submit">Sign In via Magic Links</button>
        </form>
    )
}
    