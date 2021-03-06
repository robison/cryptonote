// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require jquery.autosize
//= require sjcl
//= require clipboard
//= require markdown
//= require_tree .

// dec2hex :: Integer -> String
function dec2hex(dec) {
  return ('0' + dec.toString(16)).substr(-2)
}

// generateId :: Integer -> String
function generateId(len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

function select_all(el) {
  if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.select();
  }
}

$(document).ready(function(){
  $('#unencrypted-message').autosize();

  messageField = $('#unencrypted-message');
  $('#message-container').on('click', function(){
    messageField.focus();
  });

  messageField.keydown(function(e) {
    if(e.keyCode == 13 && e.metaKey) {
      $('#create-message').click();
    }
  });
});

$(document).ready(function(){
  var unencryptedField = $('#unencrypted-message');
  var encryptedField = $('#encrypted-message');
  var encryptionKeyField = $('#encryption-key');
  var encryptionSaltField = $('#encryption-salt');
  var password = generateId(64);

  unencryptedField.keyup(function() {
    var encryptedHash = jQuery.parseJSON(sjcl.encrypt(password, unencryptedField.val()));

    encryptionKeyField.val(encryptedHash['iv']);
    encryptionSaltField.val(encryptedHash['salt']);
    encryptedField.val(encryptedHash['ct']);
    sessionStorage.setItem('cryptonote-encryption-password', password);
  });
});

$(document).ready(function(){
  if ($('#encrypted-message-body pre').length > 0)
  {
    var encryptedTextArea = $('#encrypted-message-body pre');
    var encryptedText = encryptedTextArea.text();
    var encryptionKey = $('#key').text().replace(/(\r\n|\n|\r|\s)/gm,"");
    var encryptionSalt = $('#salt').text().replace(/(\r\n|\n|\r|\s)/gm,"");
    var password = window.location.hash.substring(1);

    encryptedRebuilt = JSON.stringify({
      'iv' : encryptionKey,
      'v' : "1",
      'iter' : 1000,
      'ks' : 128,
      'ts' : 64,
      'mode' : "ccm",
      'adata' : "",
      'cipher' : "aes",
      'salt' : encryptionSalt,
      'ct' : encryptedText
    });

    // Show decrypted message
    var decryptedMessage = sjcl.decrypt(password, encryptedRebuilt);
    // decryptedMessage = decryptedMessage.replace(/\n/g, '<br/>');
    // decryptedMessage = decryptedMessage.replace(/\s/g, '&nbsp;');
    // Sanitizes initial user input
    encryptedTextArea.text(decryptedMessage).html();

    // Convert user input markdown to HTML
    decryptedMessage = markdown.toHTML(encryptedTextArea.text());

    // Apply new HTML to the text area
    encryptedTextArea.html(decryptedMessage);
  };
});

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};