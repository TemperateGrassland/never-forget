export default function Demo() {
    return (
      <video
        className="w-[50%] max-w-screen-lg mx-auto rounded-lg shadow-lg"
        src={"/Demo.mp4"}        // Path to your video in the public folder
        autoPlay              // Start playing automatically
        loop                  // Loop the video
        muted                 // **Crucial for autoplay in most modern browsers**
        playsInline           // Important for iOS to play inline and not fullscreen
        // controls          // Uncomment if you want to show default video controls
        // width="640"       // Optional: set a fixed width
        // height="360"      // Optional: set a fixed height
        // style={{ objectFit: 'cover', width: '100%', height: '100%' }} // Example inline style
      >
        Your browser does not support the video tag. {/* Fallback text */}
      </video>
    );
  }