import { Button } from "../ui/button";
import { fine } from "@/lib/fine";

const app = {
  name: "MCP Boilerplate",
  logo: "https://avatars.githubusercontent.com/u/314135?s=200&v=4",
  description:
    "This is a boilerplate MCP that you can use to build your own remote MCP server, with Stripe integration for paid tools and Google/Github authentication.",
};

/**
 * A React component that displays an OAuth approval dialog
 * The dialog shows information about the client and server
 * and allows the user to approve or cancel the authorization
 */
export function OAuthApprovalDialog() {
  const { status, error, handleSubmit, ...data } = fine.useOAuthApproval();

  if (status === "loading")
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
      </div>
    );

  if (error)
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-4'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md'>
          <h2 className='text-xl font-semibold text-red-700 mb-2'>Authorization Error</h2>
          <p className='text-red-600'>{error}</p>
          <Button variant='outline' className='mt-4' onClick={() => (window.location.href = "/")}>
            Return Home
          </Button>
        </div>
      </div>
    );

  return (
    <div className='bg-slate-50 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 antialiased'>
      <div className='w-full max-w-lg'>
        <div className='text-center mb-8'>
          {app.logo && <img src={app.logo} alt={`${app.name} Logo`} className='mx-auto h-16 w-16 mb-4 rounded-lg object-contain text-gray-800 fill-white' />}
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800'>{app.name}</h1>
          {app.description && <p className='mt-2 text-lg text-gray-600'>{app.description}</p>}
        </div>

        <div className='mt-7 bg-white border border-gray-200 rounded-xl shadow-2xs'>
          <div className='p-5 sm:p-7'>
            <div className='text-center'>
              <h2 className='block text-xl sm:text-2xl font-bold text-gray-800'>{data.clientName} is requesting access</h2>
            </div>

            {/* Client Details */}
            <div className='mt-6 space-y-1'>
              <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pt-3 border-t border-gray-200'>Application Details</h3>
              <div className='flow-root'>
                <ul role='list' className='-my-2 divide-y divide-gray-100'>
                  <li className='flex items-start py-3'>
                    <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Name</p>
                    <p className='w-2/3 text-sm text-gray-600 break-words'>{data.clientName}</p>
                  </li>

                  {data.clientUri && (
                    <li className='flex items-start py-3'>
                      <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Website</p>
                      <a
                        href={data.clientUri}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium truncate'>
                        {data.clientUri}
                      </a>
                    </li>
                  )}

                  {data.policyUri && (
                    <li className='flex items-start py-3'>
                      <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Privacy Policy</p>
                      <a
                        href={data.policyUri}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium truncate'>
                        {data.policyUri}
                      </a>
                    </li>
                  )}

                  {data.tosUri && (
                    <li className='flex items-start py-3'>
                      <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Terms of Service</p>
                      <a
                        href={data.tosUri}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium truncate'>
                        {data.tosUri}
                      </a>
                    </li>
                  )}

                  {data.redirectUris && data.redirectUris.length > 0 && (
                    <li className='flex items-start py-3'>
                      <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Redirect URIs</p>
                      <div className='w-2/3 text-sm text-gray-600 space-y-1 break-words'>
                        {data.redirectUris.map((uri, index) => (
                          <div key={index}>{uri}</div>
                        ))}
                      </div>
                    </li>
                  )}

                  {data.contacts && data.contacts.length > 0 && (
                    <li className='flex items-start py-3'>
                      <p className='w-1/3 text-sm font-medium text-gray-700 shrink-0'>Contact</p>
                      <p className='w-2/3 text-sm text-gray-600 break-words'>{data.contacts.join(", ")}</p>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <p className='mt-6 text-sm text-center text-gray-500'>
              This MCP Client is requesting to be authorized on <strong>{app.name}</strong>. If you approve, you will be redirected to complete authentication.
            </p>

            <form onSubmit={handleSubmit} className='mt-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Button
                  type='button'
                  onClick={() => window.close()}
                  variant='outline'
                  className='w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium'>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  variant='default'
                  disabled={status === "submitting"}
                  className='w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium'>
                  {status === "submitting" ? (
                    <>
                      <span className='animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2'></span>
                      Authorizing...
                    </>
                  ) : (
                    `Authorize`
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className='text-center mt-6'>
          <p className='text-xs text-gray-600'>User privacy is important. Ensure you trust this application before approving access to your data.</p>
        </div>
      </div>
    </div>
  );
}

export default OAuthApprovalDialog;
