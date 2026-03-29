export const sendEmail = async (email, papers) => {
    console.log(`\nSending email to: ${email}`);

    papers.forEach(p => {
        console.log(`- ${p.title}`);
    });

    console.log("✅ Email sent\n");
};