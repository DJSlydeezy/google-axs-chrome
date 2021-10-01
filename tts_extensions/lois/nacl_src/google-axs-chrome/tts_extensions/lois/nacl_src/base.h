




google-axs-chrome/tts_extensions/lois/nacl_src/base.h

dmazzoni Check in source code to Lois
 0 contributors
50 lines (43 sloc)  1.56 KB
// Copyright 2010 Google Inc. All Rights Reserved.
// Author: salcianu@google.com (Alex Salcianu)
//
// Basic macros and functions.

#ifndef SPEECH_CLIENT_SYNTHESIS_SERVICE_BASE_H_
#define SPEECH_CLIENT_SYNTHESIS_SERVICE_BASE_H_

// A macro to disallow the copy constructor and operator= functions
// This should be used in the private: declarations for a class,
// preferably at the very end of the class.
#define DISALLOW_COPY_AND_ASSIGN(TypeName) \
  TypeName(const TypeName&);               \
  void operator=(const TypeName&)

// A macro that can be used to stop gcc warnings about unused
// parameters.  I find this better and more readable than using a
// compiler-specific "#pragma unused foo;".  Also better than
// commenting the parameter in the function definition: commenting
// doesn't work if the parameter has a default value, and one of the
// calls does not pass an explicit value for that parameter.
//
// Example:
//
// int MyFunction(int x) {
//   UNUSED_PARAMETER(x);
//   // Function not implemented yet; instead, we ignore x and
//   // return a safe value:
//   return 0;
// }
#define UNUSED_PARAMETER(p)  static_cast<void>(p)

// Indicates a function that does not return (e.g., because it always
// calls exit() or abort()).  Example:
//
//   NO_RETURN void Fail(const char* message) {
//     LOGE(message);
//     abort();
//   }
#ifdef __GNUC__
  #define NO_RETURN __attribute__ ((__noreturn__))
#else
  #define NO_RETURN
#endif

// Number of elements from an array.
#define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))

#endif  // SPEECH_CLIENT_SYNTHESIS_SERVICE_BASE_H_

© 2021 GitHub, Inc.
Terms
Privacy
Security
Status
Docs
Contact GitHub
Pricing
API
Training
Blog
About
