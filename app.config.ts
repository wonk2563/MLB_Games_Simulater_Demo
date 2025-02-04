export default defineAppConfig({
    ui: {
      primary: 'slate',
      button: {
        variant: {
          outline: 'ring-1 ring-inset ring-gray-400 text-gray-700 dark:text-white hover:bg-{color}-50 disabled:bg-transparent dark:disabled:bg-transparent focus-visible:ring-2 focus-visible:ring-{color}-500 dark:focus-visible:ring-{color}-400',
        }
      },
      card: {
        background: 'bg-white dark:bg-black rounded-2xl',
        divide: 'divide-y-2 divide-gray-200 dark:divide-gray-800',
        shadow: 'shadow-md',
        header: {
          base: 'dark:border-b dark:border-white',
        },
        ring: 'ring-1 ring-gray-200 dark:ring-gray-500',
      },
      dropdown: {
        background: 'bg-white dark:bg-black dark:border-white dark:border',
        item: {
          active: 'bg-gray-100 dark:bg-[#1C2129FF] text-gray-900 dark:text-white',
        }
      },
      formGroup: {
        error: 'text-red-500 dark:text-red-400',
      },
      input: {
        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 dark:border-0 dark:border-white',
        placeholder: 'placeholder-gray-400 dark:placeholder-gray-400',
        file: {
          base: 'file:px-4 file:outline-none file:transition file:duration-300 file:ease-in-out file:font-medium file:text-gray-500 dark:file:text-white file:bg-white dark:file:bg-black ',
        },
        color: {
          white: {
            outline: 'shadow-sm bg-white dark:bg-black text-black dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
          },
        }
      },
      textarea: {
        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 dark:border-1 dark:border-white',
        placeholder: 'placeholder-gray-400 dark:placeholder-gray-400',
        color: {
          white: {
            outline: 'shadow-sm bg-white dark:bg-black text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
          },
        }
      },
      radio: {
        base: 'h-4 w-4 checked:bg-orange-300 hover:checked:bg-orange-300 focus:checked:bg-orange-300 dark:checked:bg-current dark:checked:border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:ring-transparent focus:ring-offset-transparent',
      },
      checkbox: {
        base: 'h-5 w-5 indeterminate:bg-orange-300 hover:indeterminate:bg-orange-200 focus:indeterminate:bg-orange-200 checked:bg-orange-300 checked:focus:bg-orange-200 checked:hover:bg-orange-200 hover:bg-orange-200 dark:checked:bg-gray-600 dark:checked:border-transparent dark:indeterminate:bg-gray-600 dark:indeterminate:border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:ring-transparent focus:ring-offset-transparent',
        background: 'dark:bg-black',
        border: 'border border-gray-300 dark:border-gray-500',
      },
      select: {
        color: {
          white: {
            outline: 'shadow-sm bg-white dark:bg-black text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
          },
        }
      },
      selectMenu: {
        background: 'bg-white dark:bg-black dark:border-white dark:border-y dark:border-l',
        option: {
          active: 'bg-gray-100 dark:bg-[#1C2129FF]',
        },
        input: 'block w-[calc(100%+0.5rem)] focus:ring-transparent text-sm px-3 py-1.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-black border-0 border-b border-gray-200 dark:border-gray-700 sticky -top-1 -mt-1 mb-1 -mx-1 z-10 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none',
      },
      tooltip: {
        background: 'bg-white dark:bg-black',
        base: '[@media(pointer:coarse)]:hidden h-6 px-2 py-1 text-xs font-normal truncate relative dark:border dark:border-white',
      },
      divider: {
        border: {
          base: 'flex border-stone-400 dark:border-gray-400'
        }
      },
      container: {
        padding: 'px-4'
      },
      breadcrumb: {
        default: {
          divider: 'i-heroicons-chevron-right-20-solid',
        },
      },
      commandPalette: {
        wrapper: 'flex flex-col flex-1 min-h-0 divide-y divide-gray-100 dark:divide-white dark:bg-black',
        container: 'relative flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 scroll-py-2 dark:bg-black',
        input: {
          base: 'w-full placeholder-gray-400 dark:placeholder-gray-400 bg-transparent border-0 dark:bg-black text-gray-900 dark:text-white focus:ring-0 focus:outline-none',
        },
        group: {
          container: 'text-sm text-gray-700 dark:text-gray-400',
          command: {
            base: 'flex justify-between select-none items-center rounded-md px-2.5 py-1.5 gap-2 relative dark:bg-black',
            active: 'bg-[#ffe4d4] dark:bg-black text-gray-900 dark:text-white dark:rounded-md dark:border dark:border-white',
            inactive: 'dark:border dark:border-black',
          }
        },
      },
    }
  })
  